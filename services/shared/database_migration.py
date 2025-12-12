"""
資料庫遷移腳本標準化
統一資料庫版本管理和遷移
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime
import hashlib


@dataclass
class Migration:
    """遷移腳本"""
    version: str
    name: str
    up_sql: str
    down_sql: str
    checksum: str = ""
    
    def __post_init__(self):
        if not self.checksum:
            self.checksum = self._calculate_checksum()
    
    def _calculate_checksum(self) -> str:
        """計算遷移腳本校驗和"""
        content = f"{self.version}{self.name}{self.up_sql}{self.down_sql}"
        return hashlib.md5(content.encode()).hexdigest()


class MigrationRunner(ABC):
    """遷移執行器介面"""
    
    @abstractmethod
    async def get_current_version(self) -> Optional[str]:
        """獲取當前資料庫版本"""
        pass
    
    @abstractmethod
    async def execute_migration(self, migration: Migration) -> bool:
        """執行遷移"""
        pass
    
    @abstractmethod
    async def rollback_migration(self, migration: Migration) -> bool:
        """回滾遷移"""
        pass


class SimpleMigrationRunner(MigrationRunner):
    """簡單遷移執行器"""
    
    def __init__(self):
        self._current_version: Optional[str] = None
        self._applied_migrations: List[str] = []
    
    async def get_current_version(self) -> Optional[str]:
        return self._current_version
    
    async def execute_migration(self, migration: Migration) -> bool:
        """模擬執行遷移"""
        print(f"Executing migration {migration.version}: {migration.name}")
        self._current_version = migration.version
        self._applied_migrations.append(migration.version)
        return True
    
    async def rollback_migration(self, migration: Migration) -> bool:
        """模擬回滾遷移"""
        print(f"Rolling back migration {migration.version}: {migration.name}")
        if migration.version in self._applied_migrations:
            self._applied_migrations.remove(migration.version)
        
        # 設置為前一個版本
        if self._applied_migrations:
            self._current_version = self._applied_migrations[-1]
        else:
            self._current_version = None
        return True


class MigrationManager:
    """遷移管理器"""
    
    def __init__(self, runner: MigrationRunner):
        self.runner = runner
        self.migrations: List[Migration] = []
    
    def add_migration(self, migration: Migration):
        """添加遷移"""
        self.migrations.append(migration)
        # 按版本排序
        self.migrations.sort(key=lambda m: m.version)
    
    async def migrate_to_latest(self) -> bool:
        """遷移到最新版本"""
        current_version = await self.runner.get_current_version()
        
        for migration in self.migrations:
            if current_version is None or migration.version > current_version:
                success = await self.runner.execute_migration(migration)
                if not success:
                    return False
                current_version = migration.version
        
        return True
    
    async def migrate_to_version(self, target_version: str) -> bool:
        """遷移到指定版本"""
        current_version = await self.runner.get_current_version()
        
        if current_version == target_version:
            return True
        
        # 向上遷移
        if current_version is None or target_version > current_version:
            for migration in self.migrations:
                if (current_version is None or migration.version > current_version) and migration.version <= target_version:
                    success = await self.runner.execute_migration(migration)
                    if not success:
                        return False
                    current_version = migration.version
        
        # 向下遷移（回滾）
        else:
            for migration in reversed(self.migrations):
                if migration.version > target_version and (current_version is None or migration.version <= current_version):
                    success = await self.runner.rollback_migration(migration)
                    if not success:
                        return False
        
        return True


# 預定義遷移腳本
def create_initial_migration() -> Migration:
    """創建初始遷移"""
    return Migration(
        version="001",
        name="create_initial_tables",
        up_sql="""
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        down_sql="DROP TABLE users;"
    )


def create_add_index_migration() -> Migration:
    """創建索引遷移"""
    return Migration(
        version="002", 
        name="add_user_email_index",
        up_sql="CREATE INDEX idx_users_email ON users(email);",
        down_sql="DROP INDEX idx_users_email;"
    )
