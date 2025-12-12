FROM python:3.11-slim

WORKDIR /app

# 複製需求文件
COPY requirements.txt .

# 安裝依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式碼
COPY . .

# 複製共享服務
COPY ../services/shared /app/services/shared

# 暴露端口
EXPOSE 8080

# 啟動應用
CMD ["python", "main.py"]
