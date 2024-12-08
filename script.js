class CircleGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.points = [];
        this.percentage = 0;
        
        this.setupCanvas();
        this.addEventListeners();
    }

    setupCanvas() {
        // Make canvas responsive
        const resize = () => {
            const container = this.canvas.parentElement;
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        };
        
        resize();
        window.addEventListener('resize', resize);
    }

    addEventListeners() {
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseleave', this.stopDrawing.bind(this));
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startDrawing(e.touches[0]);
        });
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        // Buttons
        document.getElementById('resetBtn').addEventListener('click', this.reset.bind(this));
        document.getElementById('shareBtn').addEventListener('click', this.shareScore.bind(this));
    }

    startDrawing(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.isDrawing = true;
        this.points = [{x, y}];
        document.getElementById('instructions').style.opacity = '0';
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.points.push({x, y});
        this.drawPath();
        
        // Calculate circularity in real-time as soon as we have 3 points
        if (this.points.length >= 3) {
            this.calculateCircularity();
        } else {
            // Reset score when less than 3 points
            this.percentage = 0;
            this.updateScore();
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.calculateCircularity();
    }

    drawPath() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw guide circle (faint)
        const center = this.getCenter();
        if (this.points.length > 2) {
            this.ctx.beginPath();
            const radius = this.getAverageRadius();
            this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = 'rgba(108, 99, 255, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Draw user's path
        this.ctx.beginPath();
        this.ctx.moveTo(this.points[0].x, this.points[0].y);
        
        for (let i = 1; i < this.points.length; i++) {
            this.ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        
        this.ctx.strokeStyle = '#6C63FF';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.stroke();
    }

    calculateCircularity() {
        if (this.points.length < 3) return;

        // Calculate center point
        const center = this.getCenter();
        
        // Calculate average radius
        const radii = this.points.map(point => 
            Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2))
        );
        const avgRadius = radii.reduce((a, b) => a + b) / radii.length;
        
        // Calculate standard deviation
        const variance = radii.reduce((sum, radius) => 
            sum + Math.pow(radius - avgRadius, 2), 0) / radii.length;
        const stdDev = Math.sqrt(variance);
        
        // Calculate circularity score (0-100)
        const maxDeviation = avgRadius * 0.5; // 50% deviation = 0 score
        this.percentage = Math.max(0, Math.min(100, 100 * (1 - stdDev / maxDeviation)));
        
        this.updateScore();
    }

    getCenter() {
        const sumX = this.points.reduce((sum, point) => sum + point.x, 0);
        const sumY = this.points.reduce((sum, point) => sum + point.y, 0);
        return {
            x: sumX / this.points.length,
            y: sumY / this.points.length
        };
    }

    getAverageRadius() {
        const center = this.getCenter();
        const radii = this.points.map(point => 
            Math.sqrt(Math.pow(point.x - center.x, 2) + Math.pow(point.y - center.y, 2))
        );
        return radii.reduce((a, b) => a + b) / radii.length;
    }

    updateScore() {
        const scoreElement = document.querySelector('.percentage');
        const roundedPercentage = Math.round(this.percentage);
        scoreElement.textContent = roundedPercentage;
        
        // Animate score color based on percentage
        const hue = this.percentage * 1.2; // 0-120 (red to green)
        scoreElement.style.color = `hsl(${hue}, 80%, 50%)`;
        
        // Add visual feedback
        scoreElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
        }, 150);
    }

    reset() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.points = [];
        this.percentage = 0;
        this.updateScore();
        document.getElementById('instructions').style.opacity = '0.6';
    }

    shareScore() {
        const text = `I drew a circle with ${Math.round(this.percentage)}% perfection! Can you do better?`;
        if (navigator.share) {
            navigator.share({
                title: 'Perfect Circle Challenge',
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback to clipboard
            navigator.clipboard.writeText(text)
                .then(() => alert('Score copied to clipboard!'))
                .catch(err => console.error('Failed to copy:', err));
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CircleGame();
}); 