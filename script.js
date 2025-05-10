document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('characterCanvas');
    const ctx = canvas.getContext('2d');
    
    // Character data
    let character = {
        name: '',
        color: { r: 5, g: 5, b: 5 },
        cosmetics: {}
    };
    
    // Layer order (from bottom to top)
    const LAYER_ORDER = [
        'base',
        'color',
        'furs',
        'pants',
        'shirts',
        'chests',
        'arms',
        'paws',
        'backs',
        'badges',
        'faces',
        'hats'
    ];
    
    // Cosmetic categories with max allowed items
    const cosmeticCategories = [
        { id: 'hats', name: 'Hats', max: 1 },
        { id: 'shirts', name: 'Shirts', max: 1 },
        { id: 'badges', name: 'Badges', max: 2 },
        { id: 'arms', name: 'Arms', max: 1 },
        { id: 'paws', name: 'Paws', max: 1 },
        { id: 'faces', name: 'Faces', max: 1 },
        { id: 'pants', name: 'Pants', max: 1 },
        { id: 'chests', name: 'Chests', max: 1 },
        { id: 'backs', name: 'Backs', max: 1 },
        { id: 'furs', name: 'Furs', max: 1 }
    ];
    
    // Example cosmetic items (replace with your actual assets)
    const assets = {
        base: 'assets/images/character_base.png',
        mask: 'assets/images/character_mask.png',
        hats: {
            hat1: 'assets/images/hats/hat1.png',
            hat2: 'assets/images/hats/hat2.png'
        },
        shirts: {
            shirt1: 'assets/images/shirts/shirt1.png',
            shirt2: 'assets/images/shirts/shirt2.png'
        },
        badges: {
            badge1: 'assets/images/badges/badge1.png',
            badge2: 'assets/images/badges/badge2.png'
        },
        arms: {
            arm1: 'assets/images/arms/arm1.png',
            arm2: 'assets/images/arms/arm2.png'
        },
        paws: {
            paw1: 'assets/images/paws/paw1.png',
            paw2: 'assets/images/paws/paw2.png'
        },
        faces: {
            face1: 'assets/images/faces/face1.png',
            face2: 'assets/images/faces/face2.png'
        },
        pants: {
            pants1: 'assets/images/pants/pants1.png',
            pants2: 'assets/images/pants/pants2.png'
        },
        chests: {
            chest1: 'assets/images/chests/chest1.png',
            chest2: 'assets/images/chests/chest2.png'
        },
        backs: {
            back1: 'assets/images/backs/back1.png',
            back2: 'assets/images/backs/back2.png'
        },
        furs: {
            fur1: 'assets/images/furs/fur1.png',
            fur2: 'assets/images/furs/fur2.png'
        }
    };
    
    // Loaded images cache
    const loadedImages = {};
    let currentCosmeticCategory = '';
    
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
        
        // Create "Choose Cosmetics" buttons for each category
        const container = document.getElementById('cosmetics-container');
        
        cosmeticCategories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'cosmetic-category';
            
            const title = document.createElement('h3');
            title.textContent = `${category.name} (Max: ${category.max})`;
            categoryDiv.appendChild(title);
            
            const selectedItemsDiv = document.createElement('div');
            selectedItemsDiv.className = 'selected-cosmetics';
            selectedItemsDiv.id = `selected-${category.id}`;
            selectedItemsDiv.textContent = 'None selected';
            categoryDiv.appendChild(selectedItemsDiv);
            
            const chooseButton = document.createElement('button');
            chooseButton.textContent = `Choose ${category.name}`;
            chooseButton.className = 'choose-cosmetic';
            chooseButton.dataset.category = category.id;
            chooseButton.addEventListener('click', () => openCosmeticModal(category.id));
            categoryDiv.appendChild(chooseButton);
            
            container.appendChild(categoryDiv);
        });
        
        // Initialize modal
        initModal();
        
        // Save button
        document.getElementById('saveCharacter').addEventListener('click', saveCharacter);
        
        // Preload images
        preloadImages().then(() => {
            renderCharacter();
            updateSelectedCosmeticsDisplay();
        });
    }
    
    function initModal() {
        const modal = document.getElementById('cosmeticModal');
        const closeBtn = document.querySelector('.close-modal');
        const categoryFilter = document.getElementById('cosmeticCategoryFilter');
        
        // Close modal when clicking X
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
        
        // Filter cosmetics by category
        categoryFilter.addEventListener('change', () => {
            populateCosmeticGrid(currentCosmeticCategory, categoryFilter.value);
        });
    }
    
    function openCosmeticModal(category) {
        currentCosmeticCategory = category;
        const modal = document.getElementById('cosmeticModal');
        const categoryFilter = document.getElementById('cosmeticCategoryFilter');
        
        // Set filter to current category by default
        categoryFilter.value = category;
        
        // Populate the grid
        populateCosmeticGrid(category, category);
        
        // Show modal
        modal.style.display = 'block';
    }
    
    function populateCosmeticGrid(category, filter = 'all') {
        const grid = document.getElementById('cosmeticGrid');
        grid.innerHTML = '';
        
        // Get all cosmetics that match the filter
        let itemsToShow = [];
        
        if (filter === 'all') {
            // Show all cosmetics from all categories
            cosmeticCategories.forEach(cat => {
                itemsToShow = itemsToShow.concat(
                    Object.keys(assets[cat.id]).map(id => ({
                        id: id,
                        name: id, // Replace with proper names if available
                        type: cat.name,
                        image: assets[cat.id][id]
                    }))
                );
            });
        } else {
            // Show only cosmetics from selected category
            itemsToShow = Object.keys(assets[filter]).map(id => ({
                id: id,
                name: id, // Replace with proper names if available
                type: cosmeticCategories.find(c => c.id === filter).name,
                image: assets[filter][id]
            }));
        }
        
        // Create grid items
        itemsToShow.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cosmetic-grid-item';
            itemDiv.dataset.itemId = item.id;
            itemDiv.dataset.category = filter === 'all' ? 
                cosmeticCategories.find(c => assets[c.id][item.id]).id : 
                filter;
            
            // Check if this item is selected
            const categoryId = filter === 'all' ? 
                cosmeticCategories.find(c => assets[c.id][item.id]).id : 
                filter;
            
            if (character.cosmetics[categoryId] && character.cosmetics[categoryId].includes(item.id)) {
                itemDiv.classList.add('selected');
            }
            
            // Create image (using placeholder if image not loaded)
            const img = document.createElement('img');
            img.src = loadedImages[item.image] ? item.image : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" font-family="Arial" font-size="10" text-anchor="middle" fill="%23999">' + item.name + '</text></svg>';
            img.alt = item.name;
            itemDiv.appendChild(img);
            
            // Create name label
            const nameDiv = document.createElement('div');
            nameDiv.className = 'cosmetic-name';
            nameDiv.textContent = item.name;
            itemDiv.appendChild(nameDiv);
            
            // Create type label (only shown in "all" view)
            if (filter === 'all') {
                const typeDiv = document.createElement('div');
                typeDiv.className = 'cosmetic-type';
                typeDiv.textContent = item.type;
                itemDiv.appendChild(typeDiv);
            }
            
            // Add click handler
            itemDiv.addEventListener('click', () => {
                toggleCosmeticSelection(
                    filter === 'all' ? 
                        cosmeticCategories.find(c => assets[c.id][item.id]).id : 
                        filter,
                    item.id
                );
                
                // Update selection UI
                document.querySelectorAll('.cosmetic-grid-item').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Re-apply selected class to all selected items
                for (const cat in character.cosmetics) {
                    character.cosmetics[cat].forEach(id => {
                        const selectedEl = document.querySelector(`.cosmetic-grid-item[data-item-id="${id}"]`);
                        if (selectedEl) selectedEl.classList.add('selected');
                    });
                }
                
                // Update selected items display
                updateSelectedCosmeticsDisplay();
            });
            
            grid.appendChild(itemDiv);
        });
    }
    
    function toggleCosmeticSelection(category, itemId) {
        if (!character.cosmetics[category]) {
            character.cosmetics[category] = [];
        }
        
        const categoryData = cosmeticCategories.find(c => c.id === category);
        const currentIndex = character.cosmetics[category].indexOf(itemId);
        
        if (currentIndex === -1) {
            // Check if we can add more items of this category
            if (character.cosmetics[category].length < categoryData.max) {
                character.cosmetics[category].push(itemId);
            } else {
                // If max reached, replace the first item
                character.cosmetics[category].shift();
                character.cosmetics[category].push(itemId);
            }
        } else {
            // Remove the item
            character.cosmetics[category].splice(currentIndex, 1);
        }
        
        renderCharacter();
    }
    
    function updateSelectedCosmeticsDisplay() {
        cosmeticCategories.forEach(category => {
            const container = document.getElementById(`selected-${category.id}`);
            container.innerHTML = '';
            
            if (character.cosmetics[category.id] && character.cosmetics[category.id].length > 0) {
                const selectedText = document.createElement('span');
                selectedText.textContent = 'Selected: ';
                container.appendChild(selectedText);
                
                character.cosmetics[category.id].forEach(itemId => {
                    const itemSpan = document.createElement('span');
                    itemSpan.textContent = itemId;
                    itemSpan.style.marginRight = '8px';
                    container.appendChild(itemSpan);
                });
            } else {
                container.textContent = 'None selected';
            }
        });
    }
    
    // Preload all necessary images
    async function preloadImages() {
        const loadImage = (src) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => {
                    loadedImages[src] = img;
                    resolve();
                };
                img.onerror = () => resolve();
                img.src = src;
            });
        };
        
        // Load base images
        await loadImage(assets.base);
        await loadImage(assets.mask);
        
        // Load cosmetic images
        const promises = [];
        for (const category in assets) {
            if (category !== 'base' && category !== 'mask') {
                for (const item in assets[category]) {
                    promises.push(loadImage(assets[category][item]));
                }
            }
        }
        
        await Promise.all(promises);
    }
    
    // Render character to canvas with layers
    function renderCharacter() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate RGB values (0-9 to 0-255)
        const r = Math.round((255 / 9) * character.color.r);
        const g = Math.round((255 / 9) * character.color.g);
        const b = Math.round((255 / 9) * character.color.b);
        
        // Create temporary canvas for advanced compositing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw each layer in order
        LAYER_ORDER.forEach(layer => {
            if (layer === 'base') {
                // Draw base character
                if (loadedImages[assets.base]) {
                    ctx.drawImage(loadedImages[assets.base], 0, 0);
                }
            }
            else if (layer === 'color') {
                // Apply color overlay with multiply blend mode
                if (loadedImages[assets.base] && loadedImages[assets.mask]) {
                    // 1. Draw color layer
                    tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
                    tempCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    
                    // 2. Apply mask
                    tempCtx.globalCompositeOperation = 'destination-in';
                    tempCtx.drawImage(loadedImages[assets.mask], 0, 0);
                    
                    // 3. Apply multiply blend to main canvas
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.drawImage(tempCanvas, 0, 0);
                    ctx.globalCompositeOperation = 'source-over';
                }
            }
            else {
                // Draw cosmetics for this layer
                if (character.cosmetics[layer]) {
                    character.cosmetics[layer].forEach(cosmeticId => {
                        const imgPath = assets[layer][cosmeticId];
                        if (loadedImages[imgPath]) {
                            ctx.drawImage(loadedImages[imgPath], 0, 0);
                        }
                    });
                }
            }
        });
        
        // Draw name if provided
        if (character.name) {
            ctx.fillStyle = 'black';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(character.name, canvas.width / 2, canvas.height - 20);
        }
    }
    
    // Save character data
    function saveCharacter() {
        // In a real implementation, this would save to a server or localStorage
        console.log('Character saved:', character);
        alert('Character saved! (Check console for data)');
        
        // Save to localStorage for temporary storage
        localStorage.setItem('savedCharacter', JSON.stringify(character));
    }
    
    // Initialize
    initUI();
});
