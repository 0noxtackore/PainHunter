@echo off
title Enviar datos RRIntec a Firebase
echo Enviando datos a Firebase...
curl.exe -X PUT -H "Content-Type: application/json" -d @sim-data.json "https://pain-hunter-default-rtdb.europe-west1.firebasedatabase.app/users.json?auth=AIzaSyBfFQ5oXxi1NvwT5RJ4J84vFLWZBsnBHQY"
echo.
echo Presiona cualquier tecla para salir...
pause > nul
