"""
資料層優化測試
測試資料庫遷移、資料驗證、快取策略
"""
import pytest
import asyncio
from datetime import date, datetime
from services.shared.database_migration import (
    Migration, MigrationManager, SimpleMigrationRunner,
    create_initial_migration, create_add_index_migration
)
from services.shared.data_validation import (
    ValidationResult, RequiredValidator, StringValidator, EmailValidator,
    NumberValidator, DateValidator, SchemaValidator,
    create_user_validator, create_event_validator
)
from services.shared.cache_strategy import (
    InMemoryCache, CacheManager, CacheEntry, cached,
    get_cache_manager, set_cache_manager
)


class TestDatabaseMigration:
    """資料庫遷移測試"""
    
    @pytest.fixture
    def migration_runner(self):
        return SimpleMigrationRunner()
    
    @pytest.fixture
    def migration_manager(self, migration_runner):
        return MigrationManager(migration_runner)
    
    def test_migration_creation(self):
        """測試遷移創建"""
        migration = Migration(
            version="001",
            name="test_migration",
            up_sql="CREATE TABLE test (id INT);",
            down_sql="DROP TABLE test;"
        )
        
        assert migration.version == "001"
        assert migration.name == "test_migration"
        assert migration.checksum != ""
    
    def test_migration_checksum(self):
        """測試遷移校驗和"""
        migration1 = Migration(
            version="001",
            name="test",
            up_sql="CREATE TABLE test (id INT);",
            down_sql="DROP TABLE test;"
        )
        
        migration2 = Migration(
            version="001",
            name="test",
            up_sql="CREATE TABLE test (id INT);",
            down_sql="DROP TABLE test;"
        )
        
        # 相同內容應該有相同校驗和
        assert migration1.checksum == migration2.checksum
    
    @pytest.mark.asyncio
    async def test_migration_execution(self, migration_manager):
        """測試遷移執行"""
        migration = create_initial_migration()
        migration_manager.add_migration(migration)
        
        # 執行遷移
        success = await migration_manager.migrate_to_latest()
        assert success
        
        # 檢查當前版本
        current_version = await migration_manager.runner.get_current_version()
        assert current_version == "001"
    
    @pytest.mark.asyncio
    async def test_multiple_migrations(self, migration_manager):
        """測試多個遷移"""
        migration1 = create_initial_migration()
        migration2 = create_add_index_migration()
        
        migration_manager.add_migration(migration1)
        migration_manager.add_migration(migration2)
        
        # 執行所有遷移
        success = await migration_manager.migrate_to_latest()
        assert success
        
        # 檢查最終版本
        current_version = await migration_manager.runner.get_current_version()
        assert current_version == "002"
    
    @pytest.mark.asyncio
    async def test_migration_rollback(self, migration_manager):
        """測試遷移回滾"""
        migration1 = create_initial_migration()
        migration2 = create_add_index_migration()
        
        migration_manager.add_migration(migration1)
        migration_manager.add_migration(migration2)
        
        # 先遷移到最新
        await migration_manager.migrate_to_latest()
        
        # 回滾到版本001
        success = await migration_manager.migrate_to_version("001")
        assert success
        
        current_version = await migration_manager.runner.get_current_version()
        assert current_version == "001"


class TestDataValidation:
    """資料驗證測試"""
    
    def test_required_validator(self):
        """測試必填驗證器"""
        validator = RequiredValidator()
        
        # 測試有效值
        result = validator.validate("test", "field")
        assert result.is_valid
        
        # 測試無效值
        result = validator.validate(None, "field")
        assert not result.is_valid
        assert len(result.errors) == 1
        assert result.errors[0].code == "REQUIRED"
        
        result = validator.validate("", "field")
        assert not result.is_valid
        
        result = validator.validate([], "field")
        assert not result.is_valid
    
    def test_string_validator(self):
        """測試字符串驗證器"""
        validator = StringValidator(min_length=2, max_length=10)
        
        # 測試有效值
        result = validator.validate("test", "field")
        assert result.is_valid
        
        # 測試長度不足
        result = validator.validate("a", "field")
        assert not result.is_valid
        assert result.errors[0].code == "MIN_LENGTH"
        
        # 測試長度超出
        result = validator.validate("a" * 15, "field")
        assert not result.is_valid
        assert result.errors[0].code == "MAX_LENGTH"
        
        # 測試類型錯誤
        result = validator.validate(123, "field")
        assert not result.is_valid
        assert result.errors[0].code == "TYPE_ERROR"
    
    def test_email_validator(self):
        """測試郵箱驗證器"""
        validator = EmailValidator()
        
        # 測試有效郵箱
        result = validator.validate("test@example.com", "email")
        assert result.is_valid
        
        # 測試無效郵箱
        result = validator.validate("invalid-email", "email")
        assert not result.is_valid
        assert result.errors[0].code == "INVALID_EMAIL"
        
        result = validator.validate("test@", "email")
        assert not result.is_valid
        
        result = validator.validate("@example.com", "email")
        assert not result.is_valid
    
    def test_number_validator(self):
        """測試數字驗證器"""
        validator = NumberValidator(min_value=0, max_value=100)
        
        # 測試有效值
        result = validator.validate(50, "number")
        assert result.is_valid
        
        result = validator.validate(50.5, "number")
        assert result.is_valid
        
        # 測試最小值
        result = validator.validate(-1, "number")
        assert not result.is_valid
        assert result.errors[0].code == "MIN_VALUE"
        
        # 測試最大值
        result = validator.validate(101, "number")
        assert not result.is_valid
        assert result.errors[0].code == "MAX_VALUE"
        
        # 測試類型錯誤
        result = validator.validate("not_a_number", "number")
        assert not result.is_valid
        assert result.errors[0].code == "TYPE_ERROR"
    
    def test_date_validator(self):
        """測試日期驗證器"""
        min_date = date(2020, 1, 1)
        max_date = date(2025, 12, 31)
        validator = DateValidator(min_date=min_date, max_date=max_date)
        
        # 測試有效日期
        result = validator.validate(date(2023, 6, 15), "date")
        assert result.is_valid
        
        # 測試字符串日期
        result = validator.validate("2023-06-15", "date")
        assert result.is_valid
        
        # 測試最小日期
        result = validator.validate(date(2019, 1, 1), "date")
        assert not result.is_valid
        assert result.errors[0].code == "MIN_DATE"
        
        # 測試最大日期
        result = validator.validate(date(2026, 1, 1), "date")
        assert not result.is_valid
        assert result.errors[0].code == "MAX_DATE"
        
        # 測試無效日期字符串
        result = validator.validate("invalid-date", "date")
        assert not result.is_valid
        assert result.errors[0].code == "INVALID_DATE"
    
    def test_schema_validator(self):
        """測試模式驗證器"""
        validator = create_user_validator()
        
        # 測試有效數據
        data = {
            "email": "test@example.com",
            "name": "John Doe",
            "age": 25
        }
        result = validator.validate(data)
        assert result.is_valid
        
        # 測試無效數據
        data = {
            "email": "invalid-email",
            "name": "J",  # 太短
            "age": -5     # 負數
        }
        result = validator.validate(data)
        assert not result.is_valid
        assert len(result.errors) == 3  # 三個錯誤
    
    def test_event_validator(self):
        """測試事件驗證器"""
        validator = create_event_validator()
        
        # 測試有效事件
        data = {
            "title": "Test Event",
            "start_date": "2023-06-15",
            "end_date": "2023-06-16"
        }
        result = validator.validate(data)
        assert result.is_valid
        
        # 測試缺少必填字段
        data = {
            "title": "",  # 空標題
            "start_date": "2023-06-15"
            # 缺少 end_date
        }
        result = validator.validate(data)
        assert not result.is_valid
        assert len(result.errors) >= 1


class TestCacheStrategy:
    """快取策略測試"""
    
    @pytest.fixture
    def cache(self):
        return InMemoryCache(max_size=3, default_ttl=1.0)
    
    @pytest.fixture
    def cache_manager(self, cache):
        return CacheManager(cache)
    
    @pytest.mark.asyncio
    async def test_cache_basic_operations(self, cache):
        """測試基本快取操作"""
        # 設置值
        success = await cache.set("key1", "value1")
        assert success
        
        # 獲取值
        value = await cache.get("key1")
        assert value == "value1"
        
        # 刪除值
        success = await cache.delete("key1")
        assert success
        
        # 獲取已刪除的值
        value = await cache.get("key1")
        assert value is None
    
    @pytest.mark.asyncio
    async def test_cache_ttl(self, cache):
        """測試快取過期"""
        # 設置短期快取
        await cache.set("key1", "value1", ttl=0.1)
        
        # 立即獲取應該成功
        value = await cache.get("key1")
        assert value == "value1"
        
        # 等待過期
        await asyncio.sleep(0.2)
        
        # 獲取過期值應該返回None
        value = await cache.get("key1")
        assert value is None
    
    @pytest.mark.asyncio
    async def test_cache_eviction(self, cache):
        """測試快取驅逐"""
        # 填滿快取
        await cache.set("key1", "value1")
        await cache.set("key2", "value2")
        await cache.set("key3", "value3")
        
        # 訪問key1使其成為最近使用
        await cache.get("key1")
        
        # 添加新項目應該驅逐最久未使用的項目
        await cache.set("key4", "value4")
        
        # key1應該還在（最近使用）
        value = await cache.get("key1")
        assert value == "value1"
        
        # key4應該在
        value = await cache.get("key4")
        assert value == "value4"
    
    @pytest.mark.asyncio
    async def test_cache_clear(self, cache):
        """測試清空快取"""
        await cache.set("key1", "value1")
        await cache.set("key2", "value2")
        
        # 清空快取
        success = await cache.clear()
        assert success
        
        # 所有值都應該被清除
        value1 = await cache.get("key1")
        value2 = await cache.get("key2")
        assert value1 is None
        assert value2 is None
    
    def test_cache_key_generation(self, cache_manager):
        """測試快取鍵生成"""
        # 基本鍵
        key = cache_manager.cache_key("prefix", "arg1", "arg2")
        assert key == "prefix:arg1:arg2"
        
        # 帶參數的鍵
        key = cache_manager.cache_key("prefix", "arg1", param1="value1", param2="value2")
        assert "prefix:arg1" in key
        assert "param1=value1" in key
        assert "param2=value2" in key
    
    @pytest.mark.asyncio
    async def test_get_or_set(self, cache_manager):
        """測試獲取或設置"""
        call_count = 0
        
        def factory():
            nonlocal call_count
            call_count += 1
            return f"value_{call_count}"
        
        # 第一次調用應該執行factory
        value1 = await cache_manager.get_or_set("test_key", factory)
        assert value1 == "value_1"
        assert call_count == 1
        
        # 第二次調用應該從快取獲取
        value2 = await cache_manager.get_or_set("test_key", factory)
        assert value2 == "value_1"
        assert call_count == 1  # factory沒有再次調用
    
    def test_cache_entry(self):
        """測試快取條目"""
        import time
        
        entry = CacheEntry(
            key="test",
            value="value",
            created_at=time.time(),
            accessed_at=time.time(),
            ttl=1.0
        )
        
        # 新創建的條目不應該過期
        assert not entry.is_expired()
        
        # 更新訪問記錄
        old_access_count = entry.access_count
        entry.touch()
        assert entry.access_count == old_access_count + 1
        
        # 測試過期條目
        old_entry = CacheEntry(
            key="old",
            value="old_value",
            created_at=time.time() - 2.0,  # 2秒前創建
            accessed_at=time.time() - 2.0,
            ttl=1.0  # 1秒TTL
        )
        assert old_entry.is_expired()
    
    def test_global_cache_manager(self):
        """測試全局快取管理器"""
        # 獲取默認管理器
        manager1 = get_cache_manager()
        manager2 = get_cache_manager()
        
        # 應該是同一個實例
        assert manager1 is manager2
        
        # 設置新管理器
        new_cache = InMemoryCache()
        new_manager = CacheManager(new_cache)
        set_cache_manager(new_manager)
        
        # 獲取應該返回新管理器
        manager3 = get_cache_manager()
        assert manager3 is new_manager
        assert manager3 is not manager1


if __name__ == "__main__":
    pytest.main([__file__])
