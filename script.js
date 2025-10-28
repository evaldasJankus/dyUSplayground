document.addEventListener("DOMContentLoaded", async () => {
    const pageType = document.body.dataset.pageType;
    let products = [];

    // Load CSV
    const csvText = await fetch('products.csv').then(res => res.text());
    const [headerLine, ...lines] = csvText.trim().split('\n');
    const headers = headerLine.split(',');

    products = lines.map(line => {
        const cols = line.split(',');
        const obj = {};
        headers.forEach((h, i) => obj[h] = cols[i]);
        obj.categories = obj.categories.split('|');
        obj.keywords = obj.keywords.split('|');
        return obj;
    });

    // Function to update DY.recommendationContext
    const DYupdate = (type, data = []) => {
        DY.recommendationContext = {
            type,
            data
        };
        // console.log('DY context updated:', DY.recommendationContext);
    };

    if (pageType === 'CATEGORY') {
        const btnContainer = document.getElementById('category-buttons-container');
        const selectedCategoryName = document.getElementById('selected-category-name');
        const placeholderContainer = document.getElementById('category-placeholder-container');


        // Collect all unique categories from products
        const categorySet = new Set();
        products.forEach(p => p.categories.forEach(c => categorySet.add(c)));
        const allCategories = Array.from(categorySet);

        let selectedCategories = [];

        // Function to render placeholders and update DY context
        const updateCategoryDisplay = () => {
            // Show selected categories at top
            selectedCategoryName.textContent = selectedCategories.length ?
                `Selected Categories: ${selectedCategories.join(', ')}` :
                'No categories selected';

            DYupdate('CATEGORY', selectedCategories);

            // Render placeholders
            let html = '';
            for (let i = 1; i <= 4; i++) {
                html += `<div class="placeholder" id="category-placeholder-${i}">Placeholder ${i}</div>`;
            }
            placeholderContainer.innerHTML = html;

            // Update URL dynamically
            if (selectedCategories.length > 0) {
                const paramValue = selectedCategories.join('|');
                const newUrl = `${window.location.pathname}?categories=${encodeURIComponent(paramValue)}`;
                window.history.replaceState({}, '', newUrl);
            } else {
                const newUrl = `${window.location.pathname}`;
                window.history.replaceState({}, '', newUrl);
            }
        };

        // Function to toggle category selection
        const toggleCategory = (category) => {
            const index = selectedCategories.indexOf(category);
            if (index > -1) {
                // Already selected, remove
                selectedCategories.splice(index, 1);
            } else {
                // Add category
                selectedCategories.push(category);
            }
            updateCategoryDisplay();
            updateButtonStyles();
        };

        // Render category buttons
        const updateButtonStyles = () => {
            Array.from(btnContainer.children).forEach(btn => {
                if (selectedCategories.includes(btn.dataset.category)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        };

        allCategories.forEach(cat => {
            const btn = document.createElement('button');
            btn.textContent = cat;
            btn.dataset.category = cat;
            btn.className = 'category-btn';
            btn.addEventListener('click', () => toggleCategory(cat));
            btnContainer.appendChild(btn);
        });

        // Initialize from URL if exists
        const urlParams = new URLSearchParams(window.location.search);
        const urlCategories = urlParams.get('categories');
        if (urlCategories) {
            selectedCategories = urlCategories.split('|');
        } else {
            // Default: categories from first product
            selectedCategories = products[0].categories;
        }

        updateCategoryDisplay();
        updateButtonStyles();
    };



    if (pageType === 'PRODUCT') {
        const urlParams = new URLSearchParams(window.location.search);
        const selectElement = document.getElementById('product-select');
        const container = document.getElementById('product-container');

        // Set first product as default
        const defaultProduct = products[0];
        let selectedSKU = urlParams.get('sku') || defaultProduct.sku;

        // If no SKU in URL, update it to the default product
        if (!urlParams.get('sku')) {
            const newUrl = `${window.location.pathname}?sku=${encodeURIComponent(selectedSKU)}`;
            window.history.replaceState({}, '', newUrl);
        }

        // Populate dropdown
        products.forEach(p => {
            const option = document.createElement('option');
            option.value = p.sku;
            option.textContent = `${p.name} ($${p.price})`;
            selectElement.appendChild(option);
        });

        // Set dropdown value to selected product
        selectElement.value = selectedSKU;

        // Function to render product
        const renderProduct = (sku) => {
            const product = products.find(p => p.sku === sku);
            if (!product) return;

            DYupdate('PRODUCT', [product.sku]);

            container.innerHTML = `
      <div class="product-main">
        <img src="${product.image_url}" alt="${product.name}" class="product-image"/>
        <div class="product-details">
          <h3>${product.name}</h3>
          <p>Price: $${product.price}</p>
        </div>
      </div>
      <hr class="separator"/>
      <div class="product-placeholders">
        <div class="placeholder" id="product-placeholder-1">Placeholder 1</div>
        <div class="placeholder" id="product-placeholder-2">Placeholder 2</div>
        <div class="placeholder" id="product-placeholder-3">Placeholder 3</div>
        <div class="placeholder" id="product-placeholder-4">Placeholder 4</div>
      </div>
    `;
        };

        // Initial render
        renderProduct(selectedSKU);

        // Update on dropdown change
        selectElement.addEventListener('change', () => {
            const sku = selectElement.value;
            renderProduct(sku);

            // Update URL
            const newUrl = `${window.location.pathname}?sku=${encodeURIComponent(sku)}`;
            window.history.replaceState({}, '', newUrl);
        });
    }


    if (pageType === 'HOMEPAGE') DYupdate('HOMEPAGE', []);
    if (pageType === 'OTHER') DYupdate('OTHER', ['about']);
});
