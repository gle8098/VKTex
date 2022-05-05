#!/usr/bin/python3

import os
from os import path
import re
import base64

if os.getcwd().endswith('deploy'):
	os.chdir('..')

if path.exists('katex'):
	os.chdir('katex')

print('pwd: {}'.format(os.getcwd()))

content = False

with open('katex.min.css', 'r') as f:
	content = f.read()

if not content:
	print('File katex.min.css not found')
	exit(1)

def urlToBase64(matchobj):
	url = matchobj.group(1)
	font_content = False
	with open(url, 'rb') as font:
		font_content = font.read()
	if not font_content:
		print('Font {} not found'.format(url))
		exit(1)

	_, file_extension = os.path.splitext(url)
	file_extension = file_extension[1:]  # clears '.'
	return 'url(data:font/{};base64,{})'.format(file_extension, base64.b64encode(font_content).decode("utf-8"))

pattern = re.compile(r'url\(([^)]+)\)')
content = re.sub(pattern, urlToBase64, content)

with open('katex.min.css.new', 'w') as f:
	f.write(content)
