npx esbuild src/app.jsx --bundle --format=iife --jsx-factory=React.createElement --jsx-fragment=React.Fragment --target=es2019 --minify-syntax --outfile=build/app.js --log-level=warning
python3 - <<'PY'
css=open('src/style.css').read(); js=open('build/app.js').read()
html=f'''<title>Appeal Review Workbench</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Public+Sans:wght@400;500;600;700&display=swap">
<style>
{css}
</style>
<div id="root"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>
{js}
</script>
'''
open('build/appeal-review.html','w').write(html)
open('build/preview.html','w').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>')
PY
