(function () {
    "use strict";
  
    let countdownInterval;
  
    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
      const generateBtn = document.getElementById('generateBtn');
      generateBtn.addEventListener('click', generateQRCode);
    });
  
    async function generateQRCode() {
      const duration = document.getElementById('duration').value;
      const timestamp = Date.now();
      const token = `token_${timestamp}`;
      
      try {
        // Call backend to generate QR code
        const response = await fetch('/api/generate-qr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token, duration })
        });
        
        const data = await response.json();
        
        // Display QR code
        document.getElementById('qrCode').src = data.qrCodeUrl;
        document.getElementById('qrContainer').style.display = 'block';
        
        // Start countdown timer
        startCountdown(parseInt(duration) * 60); // Convert minutes to seconds
        
        console.log(`QR Code generated with token: ${token}`);
        console.log(`Valid for ${duration} minutes`);
        
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }
    
    function startCountdown(seconds) {
      if (countdownInterval) clearInterval(countdownInterval);
      
      const timerElement = document.getElementById('timer');
      
      countdownInterval = setInterval(() => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        timerElement.textContent = `Expires in ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        
        if (seconds <= 0) {
          clearInterval(countdownInterval);
          timerElement.textContent = 'QR Code expired';
          document.getElementById('qrContainer').style.display = 'none';
        }
        
        seconds--;
      }, 1000);
    }
  })();