document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('characterCanvas');
    const ctx = canvas.getContext('2d');
    
    // Character data
    let character = {
        name: '',
        color: { r: 5, g: 5, b: 5 },
        cosmetics: {},
        variations: {} // Stores selected variations for each cosmetic
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
        { id: 'arms', name: 'Arms', max: 1, hasVariations: true },
        { id: 'paws', name: 'Paws', max: 1, hasVariations: true },
        { id: 'faces', name: 'Faces', max: 1 },
        { id: 'pants', name: 'Pants', max: 1 },
        { id: 'chests', name: 'Chests', max: 1 },
        { id: 'backs', name: 'Backs', max: 1 },
        { id: 'furs', name: 'Furs', max: 1 }
    ];
    
    // Example cosmetic items with variations
    const assets = {
        base: 'assets/images/character_base.png',
        mask: 'assets/images/character_mask.png',
        hats: {
            hat1: {
                name: "Wizard Hat",
                preview: 'assets/images/hats/hat1_preview.png',
                render: 'assets/images/hats/hat1_render.png'
            },
            hat2: {
                name: "Baseball Cap",
                preview: 'assets/images/hats/hat2_preview.png',
                render: 'assets/images/hats/hat2_render.png'
            }
        },
        arms: {
            arm1: {
                name: "Robotic Arm",
                preview: 'assets/images/arms/arm1_preview.png',
                variations: {
                    left: {
                        name: "Left Arm",
                        render: 'assets/images/arms/arm1_left.png'
                    },
                    right: {
                        name: "Right Arm",
                        render: 'assets/images/arms/arm1_right.png'
                    },
                    both: {
                        name: "Both Arms",
                        render: ['assets/images/arms/arm1_left.png', 'assets/images/arms/arm1_right.png']
                    }
                }
            },
            arm2: {
                name: "Tattoo Sleeve",
                preview: 'assets/images/arms/arm2_preview.png',
                variations: {
                    left: {
                        name: "Left Sleeve",
                        render: 'assets/images/arms/arm2_left.png'
                    },
                    right: {
                        name: "Right Sleeve",
                        render: 'assets/images/arms/arm2_right.png'
                    }
                }
            }
        },
        // Add other categories similarly...
        paws: {
            paw1: {
                name: "Cyber Claws",
                preview: 'assets/images/paws/paw1_preview.png',
                variations: {
                    left: {
                        name: "Left Paw",
                        render: 'assets/images/paws/paw1_left.png'
                    },
                    right: {
                        name: "Right Paw",
                        render: 'assets/images/paws/paw1_right.png'
                    },
                    both: {
                        name: "Both Paws",
                        render: ['assets/images/paws/paw1_left.png', 'assets/images/paws/paw1_right.png']
                    }
                }
            }
        }
    };

    // Loaded images cache
    const loadedImages = {};
    let currentCosmeticCategory = '';
    let currentCosmeticItem = null;

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
        
        // Initialize modals
        initModal('cosmeticModal');
        initModal('variationModal');
        
        // Save button
        document.getElementById('saveCharacter').addEventListener('click', saveCharacter);
        
        // Preload images
        preloadImages().then(() => {
            renderCharacter();
            updateSelectedCosmeticsDisplay();
        });
    }
    
    function initModal(modalId) {
        const modal = document.getElementById(modalId);
        const closeBtn = modal.querySelector('.close-modal');
        
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
    
    function openVariationModal(item) {
        currentCosmeticItem = item;
        const modal = document.getElementById('variationModal');
        const grid = document.getElementById('variationGrid');
        const title = document.getElementById('variationModalTitle');
        
        title.textContent = `Select ${item.name} Variation`;
        grid.innerHTML = '';
        
        // Add variation options
        for (const [key, variation] of Object.entries(item.variations)) {
            const option = document.createElement('div');
            option.className = 'variation-option';
            option.dataset.variationKey = key;
            
            // Check if this variation is selected
            if (character.variations[item.id] === key) {
                option.classList.add('selected');
            }
            
            // Create image
            const img = document.createElement('img');
            img.src = Array.isArray(variation.render) ? 
                variation.render[0] : // Use first image for preview if multiple
                variation.render;
            img.alt = variation.name;
            option.appendChild(img);
            
            // Create name label
            const nameDiv = document.createElement('div');
            nameDiv.className = 'variation-name';
            nameDiv.textContent = variation.name;
            option.appendChild(nameDiv);
            
            // Add click handler
            option.addEventListener('click', () => {
                // Store selected variation
                character.variations[item.id] = key;
                
                // Add to cosmetics if not already there
                if (!character.cosmetics[currentCosmeticCategory]?.includes(item.id)) {
                    if (!character.cosmetics[currentCosmeticCategory]) {
                        character.cosmetics[currentCosmeticCategory] = [];
                    }
                    character.cosmetics[currentCosmeticCategory].push(item.id);
                }
                
                // Update UI
                document.querySelectorAll('.variation-option').forEach(el => {
                    el.classList.remove('selected');
                });
                option.classList.add('selected');
                
                renderCharacter();
                updateSelectedCosmeticsDisplay();
                
                // Close variation modal and return to cosmetic modal
                modal.style.display = 'none';
                document.getElementById('cosmeticModal').style.display = 'block';
            });
            
            grid.appendChild(option);
        }
        
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
                        ...assets[cat.id][id],
                        type: cat.name,
                        category: cat.id
                    }))
                );
            });
        } else {
            // Show only cosmetics from selected category
            itemsToShow = Object.keys(assets[filter]).map(id => ({
                id: id,
                ...assets[filter][id],
                type: cosmeticCategories.find(c => c.id === filter).name,
                category: filter
            }));
        }
        
        // Create grid items
        itemsToShow.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'cosmetic-grid-item';
            itemDiv.dataset.itemId = item.id;
            itemDiv.dataset.category = item.category;
            
            // Check if this item is selected
            if (character.cosmetics[item.category]?.includes(item.id)) {
                itemDiv.classList.add('selected');
            }
            
            // Create image (using preview image)
            const img = document.createElement('img');
            img.src = loadedImages[item.preview] ? item.preview : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" font-family="Arial" font-size="10" text-anchor="middle" fill="%23999">' + item.name + '</text></svg>';
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
                const categoryData = cosmeticCategories.find(c => c.id === item.category);
                
                // For items with variations, open variation modal
                if (categoryData.hasVariations) {
                    openVariationModal(item);
                    document.getElementById('cosmeticModal').style.display = 'none';
                } 
                // For regular items, toggle selection directly
                else {
                    toggleCosmeticSelection(item.category, item.id);
                    
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
                }
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
            // Also remove any variations for this item
            if (character.variations[itemId]) {
                delete character.variations[itemId];
            }
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
                    const item = assets[category.id][itemId];
                    const itemSpan = document.createElement('span');
                    
                    // For items with variations, show which variation is selected
                    if (character.variations[itemId]) {
                        const variation = item.variations[character.variations[itemId]];
                        itemSpan.textContent = `${item.name} (${variation.name})`;
                    } else {
                        itemSpan.textContent = item.name;
                    }
                    
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
                if (!src) return resolve();
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
                for (const itemId in assets[category]) {
                    const item = assets[category][itemId];
                    // Load preview image
                    promises.push(loadImage(item.preview));
                    
                    // Load render images
                    if (item.render) {
                        promises.push(loadImage(item.render));
                    }
                    
                    // Load variation images
                    if (item.variations) {
                        for (const variation of Object.values(item.variations)) {
                            if (Array.isArray(variation.render)) {
                                variation.render.forEach(img => promises.push(loadImage(img)));
                            } else {
                                promises.push(loadImage(variation.render));
                            }
                        }
                    }
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
            else if (character.cosmetics[layer]) {
                // Draw cosmetics for this layer
                character.cosmetics[layer].forEach(itemId => {
                    const item = assets[layer][itemId];
                    
                    // Handle items with variations
                    if (item.variations && character.variations[itemId]) {
                        const variation = item.variations[character.variations[itemId]];
                        
                        if (Array.isArray(variation.render)) {
                            // Draw multiple images for this variation
                            variation.render.forEach(img => {
                                if (loadedImages[img]) {
                                    ctx.drawImage(loadedImages[img], 0, 0);
                                }
                            });
                        } else if (loadedImages[variation.render]) {
                            // Draw single variation image
                            ctx.drawImage(loadedImages[variation.render], 0, 0);
                        }
                    } 
                    // Handle regular items
                    else if (item.render && loadedImages[item.render]) {
                        ctx.drawImage(loadedImages[item.render], 0, 0);
                    }
                });
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
