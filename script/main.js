// ===================================================
// 0. أسعار الشحن حسب المحافظات (عدل الأسعار هنا براحتك لما خالتك تبعتهم)
// ===================================================
// أسعار الشحن حسب المناطق الجديدة
const SHIPPING_RATES = {
    // المنطقة الأولى (75 ج.م)
    "القاهرة": 75,
    "الجيزة": 75,

    // المنطقة الثانية (85 ج.م)
    "الإسكندرية": 85,
    "الإسماعيلية": 85,
    "بورسعيد": 85,
    "السويس": 85,
    "الدقهلية": 85,
    "القليوبية": 85,
    "المنوفية": 85,
    "الشرقية": 85,
    "الغربية": 85,
    "البحيرة": 85,
    "كفر الشيخ": 85,
    "دمياط": 85,

    // المنطقة الثالثة (100 ج.م)
    "بني سويف": 100,
    "الفيوم": 100,
    "المنيا": 100,
    "أسيوط": 100,
    "سوهاج": 100,
    "قنا": 100,
    "الأقصر": 100,
    "أسوان": 100,
    "البحر الأحمر": 100,

    // المنطقة الرابعة (160 ج.م)
    "مرسى مطروح": 160,
    "الوادي الجديد": 160,
    "جنوب سيناء": 160
};

let currentShippingFee = 0; // قيمة الشحن الحالية بناءً على اختيار العميلة
let allProducts = [];       // تخزين كامل المنتجات لتشغيل البحث السريع

// ===================================================
// 1. الإعدادات الأساسية والاتصال بـ Supabase
// ===================================================
const SUPABASE_URL = "https://sdjvnkrmfelgtypogttx.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_Ox-6-5PCOYhIPRG3DZ0CuQ_1q05COmH"; 
const SupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// مصفوفة لتخزين عناصر السلة (يتم استرجاعها تلقائياً من الـ localStorage عند الفتح)
let cart = JSON.parse(localStorage.getItem('kesaa_cart')) || [];

// السيلكتورز الأساسية
const cartItemsContainer = document.getElementById('cart-items');
const cartCountElement = document.getElementById('cart-count');
const cartTotalElement = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');
const clearCartBtn = document.getElementById('clear-cart-btn');
const governorateSelect = document.getElementById('governorate');
const searchInput = document.getElementById('search-input');

// دالة حماية لحفظ بيانات السلة باستمرار
function saveCart() {
    localStorage.setItem('kesaa_cart', JSON.stringify(cart));
}

// ===================================================
// 2. تحميل البيانات عند فتح الصفحة فوراً والبحث الحي
// ===================================================
document.addEventListener('DOMContentLoaded', async () => {
    // تحديث الواجهة فوراً بالمنتجات المخزنة مسبقاً في السلة
    updateCartUI();

    // تهيئة مكتبة AOS
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            once: true     
        });
    }

    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    // إشعار التحميل للمستخدم لحين جلب البيانات
    productsGrid.innerHTML = '<h3 style="grid-column: 1/-1; text-align: center; padding: 40px;">جاري تحميل أحدث العبايات و الطرح  ... </h3>';

    try {
        // جلب المنتجات من سوبابيز مرتبة من الأحدث للأقدم
        const { data: storedProducts, error } = await SupabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        allProducts = storedProducts || [];
        renderProductsCards(allProducts);

    } catch (error) {
        console.error("خطأ في جلب البيانات: ", error);
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #ff4d4d;">حدث خطأ أثناء الاتصال بالسيرفر، يرجى المحاولة لاحقاً.</p>';
    }

    // تفعيل البحث الحي للمنتجات
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const filteredProducts = allProducts.filter(product => {
                const nameMatch = product.name && product.name.toLowerCase().includes(query);
                const descMatch = (product.description || product.desc || '').toLowerCase().includes(query);
                return nameMatch || descMatch;
            });
            renderProductsCards(filteredProducts);
        });
    }

    // الاستماع لتغيير المحافظة لتعديل الشحن
    if (governorateSelect) {
        governorateSelect.addEventListener('change', (e) => {
            const selectedGov = e.target.value;
            currentShippingFee = SHIPPING_RATES[selectedGov] || 0;
            updateCartUI();
        });
    }
});

// دالة رندر كروت المنتجات
function renderProductsCards(productsList) {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) return;

    productsGrid.innerHTML = ''; // تنظيف الحاوية

    if (productsList.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">لا توجد منتجات مطابقة للبحث.</p>';
        return;
    }

    productsList.forEach((product, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        card.setAttribute('data-aos', 'zoom-in');
        card.setAttribute('data-aos-delay', (index % 3) * 100);

        const isOutOfStock = product.stock !== undefined && product.stock <= 0;
        const productDescription = product.description || product.desc || '';

        card.innerHTML = `
            <a href="/product.html?id=${product.id}">
                <img src="${product.img}" alt="${product.name}" class="product-img">
            </a>
            <div class="product-info">
                <h3>${product.name}</h3>
                ${productDescription ? `<p class="product-desc" style="font-size: 14px; color: #666; margin: 8px 0; line-height: 1.4;">${productDescription}</p>` : ''}
                <p class="price">${product.price} ج.م</p>
                
                <!-- قائمة اختيار المقاس (Size 1 & Size 2) -->
                <div class="size-selector-container" style="margin: 10px 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
                    <label for="size-${product.id}" style="font-size: 13px; font-weight: 600;">المقاس:</label>
                    <select id="size-${product.id}" class="product-size-select" style="padding: 5px 10px; border-radius: 6px; border: 1px solid #cbd5e1; font-family: 'Cairo', sans-serif; font-size: 13px; cursor: pointer;">
                        <option value="Size 1">Size 1</option>
                        <option value="Size 2">Size 2</option>
                    </select>
                </div>

                ${isOutOfStock 
                    ? `<button class="add-to-cart-btn" disabled style="background:#cbd5e1; cursor:not-allowed;">نفذت الكمية ⚠️</button>`
                    : `<button class="add-to-cart-btn" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">إضافة للسلة</button>`
                }
            </div>
        `;
        productsGrid.appendChild(card);
    });

    if (typeof AOS !== 'undefined') {
        AOS.refresh();
    }

    setupCartButtons();
}

// ===================================================
// 3. إدارة عمليات وسلوك سلة المشتريات (Cart Control)
// ===================================================
function setupCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn:not([disabled])');
    addToCartButtons.forEach(button => {
        button.replaceWith(button.cloneNode(true));
    });

    const newButtons = document.querySelectorAll('.add-to-cart-btn:not([disabled])');
    newButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = Number(button.getAttribute('data-price'));
            
            const sizeSelect = document.getElementById(`size-${id}`);
            const selectedSize = sizeSelect ? sizeSelect.value : 'Size 1';

            addItemToCart(id, name, price, selectedSize);
        });
    });
}

function addItemToCart(id, name, price, size) {
    const existingItem = cart.find(item => item.id === id && item.size === size);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ id, name, price, size, quantity: 1 });
    }
    
    saveCart();
    updateCartUI();
}

function removeOneItem(id, size) {
    const itemIndex = cart.findIndex(item => item.id === id && item.size === size);
    
    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
    }
    saveCart();
    updateCartUI();
}

if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        cart = [];
        saveCart();
        updateCartUI();
    });
}

function updateCartUI() {
    if (!cartItemsContainer) return;
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">السلة فارغة حالياً، اختاري ما يناسبكِ!</p>';
        if (cartCountElement) cartCountElement.textContent = '0';
        if (cartTotalElement) cartTotalElement.textContent = '0';
        return;
    }

    let totalCount = 0;
    let itemsTotalPrice = 0;

    cart.forEach(item => {
        totalCount += item.quantity;
        itemsTotalPrice += (item.price * item.quantity);

        const li = document.createElement('li');
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.padding = '12px 0';
        li.style.borderBottom = '1px dotted #e2e8f0';

        li.innerHTML = `
            <div>
                <span style="font-weight: 600;">${item.name}</span>
                <span style="font-size: 12px; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin: 0 4px;">${item.size || 'Size 1'}</span>
                <span style="color: #666; font-size: 14px;">(x${item.quantity})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span style="font-weight: 700; color: var(--soft-blue);">${item.price * item.quantity} ج.م</span>
                <button class="delete-item-btn" data-id="${item.id}" data-size="${item.size}" style="background: #fff5f5; border: 1px solid #ffe3e3; color: #ff4d4d; padding: 3px 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">إلغاء ❌</button>
            </div>
        `;
        cartItemsContainer.appendChild(li);
    });

    //  مصاريف الشحن في السلة
    const shippingLi = document.createElement('li');
    shippingLi.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 14px; color: #64748b; border-bottom: 2px solid #e2e8f0;';
    shippingLi.innerHTML = `
        <span>🚚 مصاريف الشحن:</span>
        <span style="font-weight: 700; color: #475569;">${currentShippingFee > 0 ? currentShippingFee + ' ج.م' : 'إختاري المحافظة'}</span>
    `;
    cartItemsContainer.appendChild(shippingLi);

    // المجموع الكلي النهائي
    const finalTotal = itemsTotalPrice + currentShippingFee;

    if (cartCountElement) cartCountElement.textContent = totalCount;
    if (cartTotalElement) cartTotalElement.textContent = finalTotal;

    const deleteButtons = document.querySelectorAll('.delete-item-btn');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const size = btn.getAttribute('data-size');
            removeOneItem(id, size);
        });
    });
}

// ===================================================
// 4. إرسال الطلب تلقائياً عبر Telegram Bot ✈️ وخصم المخزون
// ===================================================
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (cart.length === 0) {
            alert('السلة فارغة! يرجى إضافة منتجات أولاً ليتم شحنها إليك.');
            return;
        }

        const selectedGov = governorateSelect ? governorateSelect.value : '';
        if (!selectedGov) {
            alert('يرجى اختيار المحافظة لحساب مصاريف الشحن بشكل صحيح.');
            return;
        }

        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري إرسال الطلب... ⏳';

        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;

        // حساب إجمالي المنتجات والشحن للتفصيل في رسالة تليجرام
        let itemsTotalPrice = 0;
        let productsText = '';
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            itemsTotalPrice += itemTotal;
            productsText += `  ${index + 1}. <b>${item.name}</b> [المقاس: ${item.size || 'Size 1'}] (العدد: ${item.quantity}) 👈 <i>${itemTotal} ج.م</i>\n`;
        });

        const finalGrandTotal = itemsTotalPrice + currentShippingFee;
        const orderId = Math.floor(100000 + Math.random() * 900000);

        //         
        const message = ` <b>طلب جديد (#${orderId}) من متجر كِساء</b> \n\n` +
                        `👤 <b>بيانات العميلة:</b>\n` +
                        `• <b>الاسم:</b> ${name}\n` +
                        `• <b>رقم الهاتف:</b> <code>${phone}</code>\n` +
                        `• <b>المحافظة:</b> ${selectedGov}\n` +
                        `• <b>العنوان:</b> ${address}\n\n` +
                        `🛍️ <b>المنتجات المطلوبة:</b>\n${productsText}\n` +
                        `💵 <b>إجمالي المنتجات:</b> ${itemsTotalPrice} ج.م\n` +
                        `🚚 <b>مصاريف الشحن (${selectedGov}):</b> ${currentShippingFee} ج.م\n` +
                        `💰 <b>الإجمالي النهائي المطلوبة سداده:</b> <u>${finalGrandTotal} ج.م</u>\n\n` +
                        `⏰ <b>تاريخ الطلب:</b> ${new Date().toLocaleString('ar-EG')}`;

        const TELEGRAM_BOT_TOKEN = "8858857398:AAEIfYPqKwAL20VOBR6bcG8W5c8U6SNBLdQ"; 
        const TELEGRAM_CHAT_ID = "5782928074";   

        const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        try {
            const response = await fetch(telegramURL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    chat_id: TELEGRAM_CHAT_ID,
                    text: message,
                    parse_mode: 'HTML'
                })
            });

            const result = await response.json();

            if (result.ok) {
                // 1️⃣ حفظ بيانات الطلب الأخير لصفحة شكراً
                localStorage.setItem('kesaa_last_order', JSON.stringify({
                    orderId,
                    name,
                    governorate: selectedGov,
                    items: cart,
                    shippingFee: currentShippingFee,
                    totalAmount: finalGrandTotal
                }));

                // 2️⃣ خصم الكميات من داتابيز Supabase
                for (const item of cart) {
                    try {
                        const { data: prod } = await SupabaseClient
                            .from('products')
                            .select('stock')
                            .eq('id', item.id)
                            .single();

                        if (prod && prod.stock !== undefined) {
                            const newStock = Math.max(0, prod.stock - item.quantity);
                            await SupabaseClient
                                .from('products')
                                .update({ stock: newStock })
                                .eq('id', item.id);
                        }
                    } catch (err) {
                        console.error("خطأ في خصم المخزون للمنتج:", item.name, err);
                    }
                }

                // 3️⃣ تفريغ السلة والتحويل لصفحة شكراً
                cart = [];
                saveCart();
                window.location.href = '/thank-you.html';
            } else {
                throw new Error(result.description);
            }

        } catch (error) {
            console.error("خطأ في إرسال الطلب عبر تيليجرام:", error);
            alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}

// ===================================================
// 5. تشغيل لوجيك الـ Dark Mode وتأثير دوران الأيقونة
// ===================================================
const darkModeToggle = document.getElementById('dark-mode-toggle');
const modeIcon = document.getElementById('mode-icon');

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    if (modeIcon) modeIcon.style.transform = 'rotate(360deg)';
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
            if (modeIcon) modeIcon.style.transform = 'rotate(360deg)';
        } else {
            localStorage.setItem('theme', 'light');
            if (modeIcon) modeIcon.style.transform = 'rotate(0deg)';
        }
    });
}