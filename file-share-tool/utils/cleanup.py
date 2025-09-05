import time
import threading
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

class FileCleanupScheduler:
    """文件清理调度器"""
    
    def __init__(self, file_manager, interval_minutes=60):
        self.file_manager = file_manager
        self.interval_minutes = interval_minutes
        self.scheduler = BackgroundScheduler()
        self.is_running = False
    
    def cleanup_task(self):
        """清理任务"""
        try:
            expired_count = self.file_manager.cleanup_expired_files()
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"[{current_time}] 文件清理完成，删除了 {expired_count} 个过期文件")
        except Exception as e:
            current_time = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"[{current_time}] 文件清理出错: {str(e)}")
    
    def start(self):
        """启动清理调度器"""
        if not self.is_running:
            self.scheduler.add_job(
                func=self.cleanup_task,
                trigger="interval",
                minutes=self.interval_minutes,
                id='file_cleanup',
                name='文件清理任务'
            )
            self.scheduler.start()
            self.is_running = True
            print(f"文件清理调度器已启动，每 {self.interval_minutes} 分钟执行一次清理")
    
    def stop(self):
        """停止清理调度器"""
        if self.is_running:
            self.scheduler.shutdown()
            self.is_running = False
            print("文件清理调度器已停止")
    
    def run_cleanup_now(self):
        """立即执行清理"""
        self.cleanup_task()

# 全局清理调度器实例
cleanup_scheduler = None

def start_cleanup_scheduler(file_manager, interval_minutes=60):
    """启动文件清理调度器"""
    global cleanup_scheduler
    if cleanup_scheduler is None:
        cleanup_scheduler = FileCleanupScheduler(file_manager, interval_minutes)
        cleanup_scheduler.start()
    return cleanup_scheduler

def stop_cleanup_scheduler():
    """停止文件清理调度器"""
    global cleanup_scheduler
    if cleanup_scheduler is not None:
        cleanup_scheduler.stop()
        cleanup_scheduler = None

def get_cleanup_scheduler():
    """获取清理调度器实例"""
    return cleanup_scheduler
