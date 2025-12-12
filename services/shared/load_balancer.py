"""
負載均衡器
支持多種負載均衡策略
遵循 Clean Code 原則
"""
import asyncio
import random
import time
from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from dataclasses import dataclass, field

from .service_discovery import ServiceInstance, ServiceStatus


class LoadBalancingStrategy(ABC):
    """負載均衡策略介面"""
    
    @abstractmethod
    def select_instance(self, instances: List[ServiceInstance]) -> Optional[ServiceInstance]:
        """選擇服務實例"""
        pass


class RoundRobinStrategy(LoadBalancingStrategy):
    """輪詢策略"""
    
    def __init__(self):
        self._counters: Dict[str, int] = {}
    
    def select_instance(self, instances: List[ServiceInstance]) -> Optional[ServiceInstance]:
        if not instances:
            return None
        
        # 使用服務名作為計數器鍵
        service_name = instances[0].name
        counter = self._counters.get(service_name, 0)
        
        selected = instances[counter % len(instances)]
        self._counters[service_name] = counter + 1
        
        return selected


class RandomStrategy(LoadBalancingStrategy):
    """隨機策略"""
    
    def select_instance(self, instances: List[ServiceInstance]) -> Optional[ServiceInstance]:
        if not instances:
            return None
        return random.choice(instances)


class WeightedRandomStrategy(LoadBalancingStrategy):
    """加權隨機策略"""
    
    def select_instance(self, instances: List[ServiceInstance]) -> Optional[ServiceInstance]:
        if not instances:
            return None
        
        # 簡單權重：健康實例權重為1，其他為0.1
        weights = []
        for instance in instances:
            if instance.status == ServiceStatus.HEALTHY:
                weights.append(1.0)
            elif instance.status == ServiceStatus.UNKNOWN:
                weights.append(0.5)
            else:
                weights.append(0.1)
        
        # 加權隨機選擇
        total_weight = sum(weights)
        if total_weight == 0:
            return instances[0]
        
        r = random.uniform(0, total_weight)
        cumulative = 0
        
        for i, weight in enumerate(weights):
            cumulative += weight
            if r <= cumulative:
                return instances[i]
        
        return instances[-1]


@dataclass
class LoadBalancerConfig:
    """負載均衡器配置"""
    strategy: str = "round_robin"  # round_robin, random, weighted_random
    health_check_enabled: bool = True
    max_retries: int = 3
    retry_delay: float = 0.1


class LoadBalancer:
    """負載均衡器"""
    
    def __init__(self, config: LoadBalancerConfig = None):
        self.config = config or LoadBalancerConfig()
        self._strategy = self._create_strategy(self.config.strategy)
    
    def _create_strategy(self, strategy_name: str) -> LoadBalancingStrategy:
        """創建負載均衡策略"""
        strategies = {
            "round_robin": RoundRobinStrategy,
            "random": RandomStrategy,
            "weighted_random": WeightedRandomStrategy
        }
        
        strategy_class = strategies.get(strategy_name, RoundRobinStrategy)
        return strategy_class()
    
    def select_instance(self, instances: List[ServiceInstance]) -> Optional[ServiceInstance]:
        """選擇服務實例"""
        if not instances:
            return None
        
        # 過濾健康實例
        if self.config.health_check_enabled:
            healthy_instances = [
                i for i in instances 
                if i.status in [ServiceStatus.HEALTHY, ServiceStatus.UNKNOWN]
            ]
            if healthy_instances:
                instances = healthy_instances
        
        return self._strategy.select_instance(instances)
    
    async def select_with_retry(self, instances: List[ServiceInstance]) -> Optional[ServiceInstance]:
        """帶重試的實例選擇"""
        for attempt in range(self.config.max_retries):
            instance = self.select_instance(instances)
            if instance:
                return instance
            
            if attempt < self.config.max_retries - 1:
                await asyncio.sleep(self.config.retry_delay)
        
        return None


# 全局負載均衡器實例
_load_balancer: Optional[LoadBalancer] = None


def get_load_balancer() -> LoadBalancer:
    """獲取負載均衡器實例"""
    global _load_balancer
    if _load_balancer is None:
        _load_balancer = LoadBalancer()
    return _load_balancer


def set_load_balancer(balancer: LoadBalancer):
    """設置負載均衡器（主要用於測試）"""
    global _load_balancer
    _load_balancer = balancer
