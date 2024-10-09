const socket = new WebSocket('ws://localhost:4000');

let targets = [];

function updatePlot() {
    const currentTime = Date.now();

    targets = targets.filter(target => (currentTime - target.timestamp) <= 12000);

    const angles = targets.map(target => target.angle);
    const distances = targets.map(target => target.distance); 

    const data = [{
        r: distances,
        theta: angles,
        type: 'scatterpolar',
        mode: 'markers',
        marker: {
            size: 8,
            color: distances.map((_, index) => {
                const age = (currentTime - targets[index].timestamp) / 1000; 

                if (age > 15) return 'rgba(0, 0, 0, 0)'; 
                if (age > 11) return 'rgba(0, 0, 255, 0.3)'; 
                if (age > 7) return 'rgba(0, 0, 255, 0.6)';

                return 'blue';
            }),
        },

        text: angles.map((angle, index) => `angle: ${angle}°<br>distance: ${distances[index].toFixed(3)} `), 
        hoverinfo: 'text', 
    }];

    const layout = {
        title: 'radar',
        polar: {
            radialaxis: {
                tickmode: 'linear',
                tick0: 0,
                dtick: 0.1, 
                range: [0, 0.3], // диапазон оси настраивать тут
            },
            angularaxis: {
                title: 'Кут (градуси)',
                tickmode: 'linear',
                tick0: 0,
                dtick: 10,
            }
        },
        showlegend: false 
    };

    Plotly.newPlot('radarPlot', data, layout);
}

socket.onopen = () => {
    console.log('Підключено до WebSocket сервера');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data); 
    console.log('Отримані дані:', data);

    data.echoResponses.forEach(response => {
        const distance = (response.time * 343) / 2; 
        const angle = data.scanAngle; 

        console.log(`Кут: ${angle}, Відстань (м): ${distance}`);

        targets.push({
            angle: angle,
            distance: distance, 
            power: response.power,
            timestamp: Date.now() 
        });
    });

    updatePlot();
};

socket.onclose = () => {
    console.log('З\'єднання закрито');
};

socket.onerror = (error) => {
    console.error('Помилка WebSocket:', error);
};
