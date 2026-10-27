# Convierte demo/index.html (documento completo) en el contenido de página que espera un artifact de Claude.
import re, sys
html = open(sys.argv[1], encoding="utf-8").read()
head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
title = re.search(r"<title>.*?</title>", head, re.S).group(0)
metas = re.findall(r'<meta name="claude:[^>]*>', head)
links = re.findall(r"<link [^>]*>", head)
styles = re.findall(r"<style[^>]*>.*?</style>", head, re.S)
scripts = re.findall(r"<script[^>]*>.*?</script>", head, re.S)
out = "\n".join([title, *metas, *links, *styles, body.strip(), *scripts])
open(sys.argv[2], "w", encoding="utf-8").write(out)
print(len(out))
