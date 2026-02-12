Write-Host "Cleaning up project..."
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Installing dependencies..."
npm install

Write-Host "Done! Try 'npm run dev' now."
