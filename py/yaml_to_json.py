import yaml, json
import os

book = {}

def add_yaml_to_book(filename, book):
    try:
        with open(filename, 'r') as file:
            object = yaml.safe_load(file)
            id = os.path.basename(filename)[:-5] # get id from filename by removing the .yaml extension
            if id not in book:
                book[id] = []
            book[id].append(object)
    except Exception as e:
        print(f'Error reading \'{filename}\': {e}')
        exit(1)

def add_yaml_to_book_recursively(directory, book):
    for (dir_path, _, filenames) in os.walk(directory):
        for file in filenames:
            if file.endswith('.yaml'):
                filename = dir_path + '/' + file
                add_yaml_to_book(filename, book)

book = {}

add_yaml_to_book_recursively('../data', book)

with open('../json/book.json', 'w') as file:
    json.dump(book, file)

print('✅ Book build successfully!')
