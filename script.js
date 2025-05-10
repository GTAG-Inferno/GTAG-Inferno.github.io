document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('characterCanvas');
    const ctx = canvas.getContext('2d');
    
    // Character data
    let character = {
        name: '',
        color: { r: 5, g: 5, b: 5 },
        cosmetics: {}
    };
    
    // Cosmetic categories
    const cosmeticCategories = [
        { id: 'hats', name: 'Hats', max: 1 },
        { id: 'shirts', name: 'Shirts', max: 1 },
        { id: 'pants', name: 'Pants', max: 1 },
        { id: 'shoes', name: 'Shoes', max: 1 },
        { id: 'accessories', name: 'Accessories', max: 2 }
    ];
    
    // Example cosmetic items (replace with your images)
    const cosmeticItems = {
        hats: [
            { id: 'hat1', name: 'Cap', image: 'assets/images/hat1.png' },
            { id: 'hat2', name: 'Helmet', image: 'assets/images/hat2.png' }
        ],
        shirts: [
            { id: 'shirt1', name: 'T-Shirt', image: 'assets/images/shirt1.png' },
            { id: 'shirt2', name: 'Jacket', image: 'assets/images/shirt2.png' }
        ],
        // Add more categories...
    };
    
    // Initialize UI
    function initUI() {
        // Name input
        document.getElementById('characterName').addEventListener('input', function(e) {
            character.name = e.target.value;
            renderCharacter();
        });
        
        // Color inputs
        ['r', 'g', 'b'].forEach(component => {
            document.getElementById(`color${component.toUpperCase()}`).addEventListener('input', function(e) {
                character.color[component] = parseInt(e.target.value) || 0;
                renderCharacter();
            });
        });
        
        // Create cosmetic buttons
        const container = document.getElementById('cosmetics-container');
        cosmeticCategories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'cosmetic-category';
            
            const title = document.createElement('h3');
            title.textContent = `${category.name} (Max: ${category.max})`;
            categoryDiv.appendChild(title);
            
            const chooseButton = document.createElement('button');
            chooseButton.textContent = `Choose ${category.name}`;
            chooseButton.addEventListener('click', () => openCosmeticModal(category.id));
            categoryDiv.appendChild(chooseButton);
            
            container.appendChild(categoryDiv);
        });
        
        // Save button
        document.getElementById('saveCharacter').addEventListener('click', saveCharacter);
    }
    
    // Render character
    function renderCharacter() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate color
        const r = Math.round((255 / 9) * character.color.r);
        const g = Math.round((255 / 9) * character.color.g);
        const b = Math.round((255 / 9) * character.color.b);
        
        // Draw character (simplified for this guide)
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(50, 50, 200, 300); // Example shape
        
        // Draw name
        if (character.name) {
            ctx.fillStyle = 'black';
            ctx.font = '16px Arial';
            ctx.fillText(character.name, 150, 30);
        }
    }
    
    // Open cosmetic selection
    function openCosmeticModal(category) {
        const modal = document.getElementById('cosmeticModal');
        modal.style.display = 'block';
    }
    
    // Save character
    function saveCharacter() {
        alert('Character saved! (Check console for details)');
        console.log('Character data:', character);
    }
    
    // Initialize everything
    initUI();
    renderCharacter();
});
