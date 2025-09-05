#!/usr/bin/env python3
"""
测试API功能
"""

import requests
import json

def test_text_save():
    """测试文本保存功能"""
    url = "http://localhost:5000/api/text/save"
    data = {
        "filename": "测试文件.txt",
        "content": "这是一个测试文件的内容\n用于验证文本保存功能是否正常工作。"
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"文本保存测试:")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text}")
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"文本保存测试失败: {e}")
        return None

def test_file_list():
    """测试文件列表功能"""
    url = "http://localhost:5000/api/files"
    
    try:
        response = requests.get(url)
        print(f"\n文件列表测试:")
        print(f"状态码: {response.status_code}")
        print(f"响应: {response.text}")
        return response.json() if response.status_code == 200 else None
    except Exception as e:
        print(f"文件列表测试失败: {e}")
        return None

def test_file_download(file_id):
    """测试文件下载功能"""
    url = f"http://localhost:5000/api/download/{file_id}"
    
    try:
        response = requests.get(url)
        print(f"\n文件下载测试:")
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            print(f"文件内容长度: {len(response.content)} 字节")
            print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        else:
            print(f"错误响应: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"文件下载测试失败: {e}")
        return False

if __name__ == "__main__":
    print("开始API测试...")
    
    # 测试文本保存
    save_result = test_text_save()
    
    # 测试文件列表
    list_result = test_file_list()
    
    # 如果有文件，测试下载
    if save_result and save_result.get('success') and save_result.get('file_id'):
        file_id = save_result['file_id']
        test_file_download(file_id)
    elif list_result and list_result.get('success') and list_result.get('files'):
        files = list_result['files']
        if files:
            file_id = files[0]['id']
            test_file_download(file_id)
    
    print("\nAPI测试完成。")
