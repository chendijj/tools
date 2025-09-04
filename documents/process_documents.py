import re
import os
import sys

def process_function_documents(input_file):
    """
    处理功能单据文本文件，按类别分类并格式化输出
    
    Args:
        input_file: 输入文件路径
    
    Returns:
        处理后的文本内容
    """
    
    # 检查文件是否存在
    if not os.path.exists(input_file):
        raise FileNotFoundError(f"输入文件不存在: {input_file}")
    
    # 读取文件内容
    try:
        with open(input_file, 'r', encoding='utf-8') as file:
            content = file.read()
    except Exception as e:
        raise Exception(f"读取文件失败: {e}")
    
    # 使用正则表达式匹配功能单据
    pattern = r'【(.*?)】([^\n]+)'
    matches = re.findall(pattern, content)
    
    # 按类别分类
    categories = {}
    
    # 处理有【】符号的功能单据
    for category, function_name in matches:
        category = category.strip()
        function_name = function_name.strip()
        
        if category not in categories:
            categories[category] = []
        categories[category].append(function_name)
    
    # 提取没有【】符号的行（其他功能单据）
    lines = content.split('\n')
    other_functions = []
    
    for line in lines:
        line = line.strip()
        if line and not re.match(r'【.*?】', line):
            # 检查是否已经被匹配过（避免重复）
            is_matched = False
            for category, function_name in matches:
                if line == function_name.strip():
                    is_matched = True
                    break
            if not is_matched:
                other_functions.append(line)
    
    # 添加其他类别
    if other_functions:
        categories['其他'] = other_functions
    
    # 生成格式化输出
    output_lines = []
    for category, functions in categories.items():
        # 添加类别标题（去除【】符号）
        output_lines.append(f"{category}及其子功能单据{len(functions)}个")
        
        # 添加序号功能列表（在功能名称前添加【】符号，其他类别除外）
        for i, function in enumerate(functions, 1):
            if category == '其他':
                output_lines.append(f" {i}、{function}")
            else:
                output_lines.append(f" {i}、【{category}】{function}")
        
        # 添加空行分隔
        output_lines.append("")
    
    # 移除最后的空行
    if output_lines and output_lines[-1] == "":
        output_lines.pop()
    
    return "\n".join(output_lines)

def save_output_file(input_file, output_content):
    """
    保存输出文件到同目录下
    
    Args:
        input_file: 输入文件路径
        output_content: 输出内容
    """
    
    # 生成输出文件路径
    file_dir = os.path.dirname(input_file)
    file_name = os.path.splitext(os.path.basename(input_file))[0]
    output_file = os.path.join(file_dir, f"{file_name}_sorted.txt")
    
    # 写入文件
    try:
        with open(output_file, 'w', encoding='utf-8') as file:
            file.write(output_content)
        print(f"处理完成！输出文件已保存至: {output_file}")
        return output_file
    except Exception as e:
        raise Exception(f"写入输出文件失败: {e}")

def main():
    """主函数"""
    
    # 获取输入文件路径
    if len(sys.argv) > 1:
        input_file = sys.argv[1]
    else:
        # 默认使用当前目录下的input.txt
        input_file = "input.txt"
    
    try:
        print(f"开始处理文件: {input_file}")
        
        # 处理功能单据
        output_content = process_function_documents(input_file)
        
        # 保存输出文件
        output_file = save_output_file(input_file, output_content)
        
        
    except Exception as e:
        print(f"处理失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()