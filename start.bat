@echo off
echo =========================================
echo Setting up CineMatch Python Backend...
echo =========================================
pip install -r requirements.txt
echo.
echo Starting Server...
echo Please open http://127.0.0.1:5000 in your browser!
echo.
python app.py
pause
