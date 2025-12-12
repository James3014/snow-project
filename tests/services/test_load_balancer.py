"""
負載均衡器測試
遵循 TDD 原則
"""
import pytest
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../..'))

from services.shared.load_balancer import (
    LoadBalancer,
    LoadBalancerConfig,
    RoundRobinStrategy,
    RandomStrategy,
    WeightedRandomStrategy,
    get_load_balancer
)
from services.shared.service_discovery import ServiceInstance, ServiceStatus


class TestRoundRobinStrategy:
    """輪詢策略測試"""
    
    def test_round_robin_selection(self):
        """測試輪詢選擇"""
        strategy = RoundRobinStrategy()
        
        instances = [
            ServiceInstance("api", "host1", 8080),
            ServiceInstance("api", "host2", 8080),
            ServiceInstance("api", "host3", 8080)
        ]
        
        # 測試輪詢順序
        selected1 = strategy.select_instance(instances)
        selected2 = strategy.select_instance(instances)
        selected3 = strategy.select_instance(instances)
        selected4 = strategy.select_instance(instances)  # 應該回到第一個
        
        assert selected1.host == "host1"
        assert selected2.host == "host2"
        assert selected3.host == "host3"
        assert selected4.host == "host1"
    
    def test_round_robin_empty_list(self):
        """測試空列表"""
        strategy = RoundRobinStrategy()
        result = strategy.select_instance([])
        assert result is None


class TestRandomStrategy:
    """隨機策略測試"""
    
    def test_random_selection(self):
        """測試隨機選擇"""
        strategy = RandomStrategy()
        
        instances = [
            ServiceInstance("api", "host1", 8080),
            ServiceInstance("api", "host2", 8080)
        ]
        
        # 多次選擇，應該都在實例列表中
        for _ in range(10):
            selected = strategy.select_instance(instances)
            assert selected in instances
    
    def test_random_empty_list(self):
        """測試空列表"""
        strategy = RandomStrategy()
        result = strategy.select_instance([])
        assert result is None


class TestWeightedRandomStrategy:
    """加權隨機策略測試"""
    
    def test_weighted_selection_healthy_preferred(self):
        """測試健康實例優先選擇"""
        strategy = WeightedRandomStrategy()
        
        healthy_instance = ServiceInstance("api", "host1", 8080)
        healthy_instance.status = ServiceStatus.HEALTHY
        
        unhealthy_instance = ServiceInstance("api", "host2", 8080)
        unhealthy_instance.status = ServiceStatus.UNHEALTHY
        
        instances = [healthy_instance, unhealthy_instance]
        
        # 多次選擇，健康實例應該被選中更多次
        healthy_count = 0
        total_selections = 100
        
        for _ in range(total_selections):
            selected = strategy.select_instance(instances)
            if selected.host == "host1":
                healthy_count += 1
        
        # 健康實例應該被選中更多次（權重更高）
        assert healthy_count > total_selections * 0.7  # 至少70%


class TestLoadBalancer:
    """負載均衡器測試"""
    
    def test_load_balancer_default_config(self):
        """測試預設配置"""
        balancer = LoadBalancer()
        
        assert balancer.config.strategy == "round_robin"
        assert balancer.config.health_check_enabled is True
        assert balancer.config.max_retries == 3
    
    def test_load_balancer_custom_config(self):
        """測試自定義配置"""
        config = LoadBalancerConfig(
            strategy="random",
            health_check_enabled=False,
            max_retries=5
        )
        balancer = LoadBalancer(config)
        
        assert balancer.config.strategy == "random"
        assert balancer.config.health_check_enabled is False
        assert balancer.config.max_retries == 5
    
    def test_select_instance_with_health_check(self):
        """測試帶健康檢查的實例選擇"""
        config = LoadBalancerConfig(health_check_enabled=True)
        balancer = LoadBalancer(config)
        
        healthy_instance = ServiceInstance("api", "host1", 8080)
        healthy_instance.status = ServiceStatus.HEALTHY
        
        unhealthy_instance = ServiceInstance("api", "host2", 8080)
        unhealthy_instance.status = ServiceStatus.UNHEALTHY
        
        instances = [unhealthy_instance, healthy_instance]
        
        # 應該選擇健康實例
        selected = balancer.select_instance(instances)
        assert selected.host == "host1"
    
    def test_select_instance_without_health_check(self):
        """測試不帶健康檢查的實例選擇"""
        config = LoadBalancerConfig(health_check_enabled=False)
        balancer = LoadBalancer(config)
        
        unhealthy_instance = ServiceInstance("api", "host1", 8080)
        unhealthy_instance.status = ServiceStatus.UNHEALTHY
        
        instances = [unhealthy_instance]
        
        # 即使不健康也應該被選中
        selected = balancer.select_instance(instances)
        assert selected.host == "host1"
    
    def test_select_instance_empty_list(self):
        """測試空實例列表"""
        balancer = LoadBalancer()
        result = balancer.select_instance([])
        assert result is None
    
    @pytest.mark.asyncio
    async def test_select_with_retry(self):
        """測試帶重試的選擇"""
        config = LoadBalancerConfig(max_retries=2, retry_delay=0.01)
        balancer = LoadBalancer(config)
        
        instance = ServiceInstance("api", "host1", 8080)
        instances = [instance]
        
        selected = await balancer.select_with_retry(instances)
        assert selected is not None
        assert selected.host == "host1"
    
    @pytest.mark.asyncio
    async def test_select_with_retry_empty_list(self):
        """測試空列表的重試選擇"""
        balancer = LoadBalancer()
        result = await balancer.select_with_retry([])
        assert result is None


class TestLoadBalancerGlobals:
    """全局負載均衡器測試"""
    
    def test_get_load_balancer_singleton(self):
        """測試負載均衡器單例"""
        balancer1 = get_load_balancer()
        balancer2 = get_load_balancer()
        
        assert balancer1 is balancer2
        assert isinstance(balancer1, LoadBalancer)


class TestLoadBalancerConfig:
    """負載均衡器配置測試"""
    
    def test_default_config(self):
        """測試預設配置"""
        config = LoadBalancerConfig()
        
        assert config.strategy == "round_robin"
        assert config.health_check_enabled is True
        assert config.max_retries == 3
        assert config.retry_delay == 0.1
    
    def test_custom_config(self):
        """測試自定義配置"""
        config = LoadBalancerConfig(
            strategy="weighted_random",
            health_check_enabled=False,
            max_retries=5,
            retry_delay=0.2
        )
        
        assert config.strategy == "weighted_random"
        assert config.health_check_enabled is False
        assert config.max_retries == 5
        assert config.retry_delay == 0.2
