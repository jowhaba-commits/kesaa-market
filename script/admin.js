// ===================================================
// 1. الاتصال بـ Supabase
// ===================================================
const SUPABASE_URL = "https://sdjvnkrmfelgtypogttx.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_Ox-6-5PCOYhIPRG3DZ0CuQ_1q05COmH"; 
const SupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// العناصر الإنشائية
const productForm = document.getElementById('product-form');
const productIdInput = document.getElementById('product-id');
const productNameInput = document.getElementById('product-name');
const productDescriptionInput = document.getElementById('product-description');
const productPriceInput = document.getElementById('product-price');
const productStockInput = document.getElementById('product-stock');
const productImgInput = document.getElementById('product-img');
const imgPreview = document.getElementById('img-preview');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelEditBtn = document.getElementById('cancel-edit-btn');
const tableBody = document.getElementById('admin-products-table');
const searchInput = document.getElementById('search-input');

// عناصر الإحصائيات
const statTotalProducts = document.getElementById('stat-total-products');
const statTotalOrders = document.getElementById('stat-total-orders');
const statAvgPrice = document.getElementById('stat-avg-price');
const statTotalValue = document.getElementById('stat-total-value');

let allProducts = [];

// ===================================================
// 2. تحميل البيانات عند فتح الصفحة
// ===================================================
document.addEventListener('DOMContentLoaded', fetchProducts);

async function fetchProducts() {
    try {
        const { data, error } = await SupabaseClient
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        allProducts = data || [];
        renderTable(allProducts);
        updateStats(allProducts);

    } catch (err) {
        console.error("خطأ في جلب البيانات:", err);
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: red;">حدث خطأ أثناء جلب المنتجات.</td></tr>`;
    }
}

// ===================================================
// 3. عرض المنتجات في الجدول وتطوير الإحصائيات
// ===================================================
function renderTable(products) {
    tableBody.innerHTML = '';

    if (products.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">لا توجد منتجات مطابقة.</td></tr>`;
        return;
    }

    products.forEach(p => {
        const tr = document.createElement('tr');
        const stockQty = p.stock !== undefined && p.stock !== null ? p.stock : 10;
        
        tr.innerHTML = `
            <td><img src="${p.img}" alt="${p.name}" class="table-thumb" onerror="this.src='https://via.placeholder.com/50'"></td>
            <td><strong>${p.name}</strong></td>
            <td><span style="color: var(--soft-blue); font-weight:700;">${p.price} ج.م</span></td>
            <td>
                <span class="stock-badge" style="background: ${stockQty > 0 ? '#e0f2fe' : '#fee2e2'}; color: ${stockQty > 0 ? '#0369a1' : '#b91c1c'}; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 13px;">
                    ${stockQty > 0 ? stockQty + ' قطعة' : 'نفذت الكمية ⚠️'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editProduct('${p.id}')">تعديل ✏️</button>
                <button class="action-btn delete-btn" onclick="deleteProduct('${p.id}')">حذف 🗑️</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateStats(products) {
    const totalCount = products.length;
    // حساب إجمالي القيمة برباط السعر بالكمية بالمخزون
    const totalVal = products.reduce((sum, p) => {
        const qty = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 10;
        return sum + (Number(p.price || 0) * qty);
    }, 0);

    const avgVal = totalCount > 0 ? (products.reduce((sum, p) => sum + Number(p.price || 0), 0) / totalCount).toFixed(0) : 0;
    
    // جلب عدد الطلبات من الـ LocalStorage
    const ordersCount = localStorage.getItem('kesaa_orders_count') || 0;

    if (statTotalProducts) statTotalProducts.textContent = totalCount;
    if (statTotalOrders) statTotalOrders.textContent = ordersCount;
    if (statTotalValue) statTotalValue.textContent = `${totalVal.toLocaleString()} ج.م`;
    if (statAvgPrice) statAvgPrice.textContent = `${avgVal} ج.م`;
}

// ===================================================
// 4. معاينة الصورة مباشرة عند إدخال رابطها
// ===================================================
productImgInput.addEventListener('input', () => {
    const url = productImgInput.value.trim();
    if (url) {
        imgPreview.src = url;
        imgPreview.style.display = 'block';
    } else {
        imgPreview.style.display = 'none';
    }
});

// ===================================================
// 5. حفظ منتج جديد أو تعديل منتج قائم (Create & Update)
// ===================================================
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = productIdInput.value;
    const name = productNameInput.value.trim();
    const description = productDescriptionInput ? productDescriptionInput.value.trim() : '';
    const price = Number(productPriceInput.value);
    const stock = Number(productStockInput.value);
    const img = productImgInput.value.trim();

    submitBtn.disabled = true;
    submitBtn.textContent = "جاري الحفظ...";

    try {
        if (id) {
            // تحديث منتج موجود
            const { error } = await SupabaseClient
                .from('products')
                .update({ name, description, price, stock, img })
                .eq('id', id);

            if (error) throw error;
            alert("تم تعديل المنتج بنجاح! 🎉");
        } else {
            // إضافة منتج جديد
            const { error } = await SupabaseClient
                .from('products')
                .insert([{ name, description, price, stock, img }]);

            if (error) throw error;
            alert("تمت إضافة المنتج الجديد بنجاح! 🚀");
        }

        resetForm();
        fetchProducts();

    } catch (err) {
        console.error("خطأ في عملية الحفظ:", err);
        alert("حدث خطأ أثناء الحفظ، يرجى التأكد من إضافة عمودي stock و description في داتابيز Supabase والمحاولة مجدداً.");
    } finally {
        submitBtn.disabled = false;
    }
});

// ===================================================
// 6. وضع المنتج في نمط التعديل (Edit Mode)
// ===================================================
window.editProduct = function(id) {
    const product = allProducts.find(p => p.id === id);
    if (!product) return;

    productIdInput.value = product.id;
    productNameInput.value = product.name;
    if (productDescriptionInput) productDescriptionInput.value = product.description || '';
    productPriceInput.value = product.price;
    productStockInput.value = product.stock !== undefined ? product.stock : 10;
    productImgInput.value = product.img;

    imgPreview.src = product.img;
    imgPreview.style.display = 'block';

    formTitle.textContent = "تعديل المنتج";
    submitBtn.textContent = "تحديث البيانات 🔄";
    cancelEditBtn.style.display = 'block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
};

cancelEditBtn.addEventListener('click', resetForm);

function resetForm() {
    productIdInput.value = '';
    productForm.reset();
    if (productDescriptionInput) productDescriptionInput.value = '';
    imgPreview.style.display = 'none';
    formTitle.textContent = "إضافة منتج جديد";
    submitBtn.textContent = "حفظ المنتج ✨";
    cancelEditBtn.style.display = 'none';
}

// ===================================================
// 7. حذف منتج (Delete)
// ===================================================
window.deleteProduct = async function(id) {
    if (!confirm("هل أنت تأكد من رغبتك في حذف هذا المنتج؟")) return;

    try {
        const { error } = await SupabaseClient
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert("تم حذف المنتج بنجاح.");
        fetchProducts();

    } catch (err) {
        console.error("خطأ في الحذف:", err);
        alert("تعذر حذف المنتج.");
    }
};

// ===================================================
// 8. تصفية وبحث في المنتجات
// ===================================================
searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderTable(filtered);
});

// ===================================================
// 9. دعم الوضع الداكن (Dark Mode)
// ===================================================
const darkModeToggle = document.getElementById('dark-mode-toggle');
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
}

if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    });
}