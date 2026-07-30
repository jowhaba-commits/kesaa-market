// ===================================================
// 1. الاتصال بـ Supabase
// ===================================================
const SUPABASE_URL = "https://sdjvnkrmfelgtypogttx.supabase.co"; 
const SUPABASE_KEY = "sb_publishable_Ox-6-5PCOYhIPRG3DZ0CuQ_1q05COmH"; 
const SupabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async () => {
    const landingForm = document.getElementById('landing-order-form');
    const mainImg = document.getElementById('main-landing-img');
    const overlay = document.getElementById('image-overlay');
    const overlayImg = document.getElementById('overlay-img');
    const closeOverlay = document.querySelector('.close-overlay');
    
    // العناصر اللي بنعرض فيها بيانات المنتج
    const titleElem = document.getElementById('landing-product-title') || document.getElementById('product-title');
    const priceElem = document.getElementById('landing-product-price') || document.getElementById('product-price');
    const descElem = document.getElementById('landing-product-description') || document.getElementById('product-description') || document.querySelector('.product-desc');
    const submitBtn = landingForm ? landingForm.querySelector('button[type="submit"]') : null;

    // جلب رقم/ID المنتج من رابط الصفحة (URL)
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    let currentProduct = null;

    // ===================================================
    // 2. جلب المنتج المخصص والوصف من Supabase
    // ===================================================
    if (productId) {
        try {
            const { data, error } = await SupabaseClient
                .from('products')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;

            if (data) {
                currentProduct = data;

                // حقن البيانات والوصف في الصفحة
                if (titleElem) titleElem.textContent = data.name;
                if (priceElem) priceElem.textContent = `${data.price} ج.م`;
                if (mainImg && data.img) mainImg.src = data.img;
                
                //  عرض وصف المنتج المخصص
                if (descElem) {
                    const descText = data.description || data.desc || 'لا يوجد وصف إضافي لهذا المنتج.';
                    descElem.textContent = descText;
                }

                // التحقق من المخزون
                if (data.stock !== undefined && data.stock <= 0) {
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'عذراً، نفذت الكمية ⚠️';
                        submitBtn.style.background = '#cbd5e1';
                        submitBtn.style.cursor = 'not-allowed';
                    }
                }
            }
        } catch (err) {
            console.error("خطأ في جلب بيانات المنتج لصفحة الهبوط:", err);
        }
    }

    // ===================================================
    // 3. تكبير الصورة عند الضغط عليها
    // ===================================================
    if (mainImg && overlay && overlayImg) {
        mainImg.addEventListener('click', () => {
            overlay.style.display = 'flex';
            overlayImg.src = mainImg.src;
        });

        if (closeOverlay) {
            closeOverlay.addEventListener('click', () => { overlay.style.display = 'none'; });
        }
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { overlay.style.display = 'none'; }
        });
    }

    // ===================================================
    // 4. إرسال الطلب لتيليجرام وتحديث المخزون
    // ===================================================
    if (landingForm) {
        landingForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const sizeElem = document.getElementById('selected-size');
            const qtyElem = document.getElementById('selected-qty');
            
            const size = sizeElem ? sizeElem.value : 'مقاس موحد';
            const qty = qtyElem ? Number(qtyElem.value) : 1;
            const name = document.getElementById('c-name').value.trim();
            const phone = document.getElementById('c-phone').value.trim();
            const address = document.getElementById('c-address').value.trim();

            const pName = currentProduct ? currentProduct.name : "منتج من متجر كساء";
            const pPrice = currentProduct ? currentProduct.price : 0;
            const total = (pPrice * qty).toFixed(2);

            const originalBtnText = submitBtn ? submitBtn.textContent : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'جاري تسجيل الطلب... ⏳';
            }

            const message = ` <b> طلب شراء جديد من  متجر كساء</b> \n\n` +
                            `🛍️ <b>المنتج:</b> ${pName}\n` +
                            `📐 <b>المقاس المختار:</b> ${size}\n` +
                            `🔢 <b>الكمية:</b> ${qty}\n` +
                            `💰 <b>الإجمالي:</b> <u>${total} ج.م</u>\n\n` +
                            `👤 <b>بيانات العميلة:</b>\n` +
                            `• <b>الاسم:</b> ${name}\n` +
                            `• <b>رقم الهاتف:</b> <code>${phone}</code>\n` +
                            `• <b>العنوان:</b> ${address}\n\n` +
                            `⏰ <b>التاريخ:</b> ${new Date().toLocaleString('ar-EG')}`;

            const TELEGRAM_BOT_TOKEN = "8858857398:AAEIfYPqKwAL20VOBR6bcG8W5c8U6SNBLdQ"; 
            const TELEGRAM_CHAT_ID = "8691721428";   
            const telegramURL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

            try {
                const response = await fetch(telegramURL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: TELEGRAM_CHAT_ID,
                        text: message,
                        parse_mode: 'HTML'
                    })
                });

                const result = await response.json();

                if (result.ok) {
                    // زيادة عداد الطلبات
                    let currentOrders = Number(localStorage.getItem('kesaa_orders_count') || 0);
                    localStorage.setItem('kesaa_orders_count', currentOrders + 1);

                    // خصم المخزون
                    if (currentProduct && currentProduct.id) {
                        const newStock = Math.max(0, (currentProduct.stock || 10) - qty);
                        await SupabaseClient
                            .from('products')
                            .update({ stock: newStock })
                            .eq('id', currentProduct.id);
                    }

                    alert(`شكراً لكِ يا ${name} \nتم تسجيل طلبكِ لـ (${pName}) بنجاح!`);
                    landingForm.reset();
                } else {
                    throw new Error(result.description);
                }

            } catch (err) {
                console.error("خطأ أثناء إرسال الطلب:", err);
                alert('حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }
});