import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('=== BẮT ĐẦU RESET VÀ SEED DATA CHO QUÁN CAFE HẬU LÊ ===');

    // 1. Xóa dữ liệu cũ
    console.log('Đang xóa dữ liệu cũ...');
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.favoriteProduct.deleteMany({});
    await prisma.flashSaleItem.deleteMany({});
    await prisma.flashSaleCampaign.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    console.log('Đã xóa dữ liệu cũ thành công!');

    // 2. Tạo danh mục mới
    console.log('Đang tạo danh mục mới...');
    const categoriesData = [
        { name: 'Cà Phê Truyền Thống', slug: 'ca-phe-truyen-thong', description: 'Các loại cà phê pha phin, pha máy đậm đà hương vị Việt Nam' },
        { name: 'Cà Phê Ý', slug: 'ca-phe-y', description: 'Espresso, Latte, Cappuccino...' },
        { name: 'Trà Trái Cây', slug: 'tra-trai-cay', description: 'Trà đào, trà vải, trà dâu tươi mát' },
        { name: 'Trà Sữa', slug: 'tra-sua', description: 'Các loại trà sữa thơm ngon béo ngậy' },
        { name: 'Sinh Tố & Nước Ép', slug: 'sinh-to-nuoc-ep', description: 'Trái cây tươi xay và ép nguyên chất' },
        { name: 'Bánh Ngọt & Đồ Ăn Vặt', slug: 'banh-ngot-do-an-vat', description: 'Bánh ngọt ăn kèm và các món ăn vặt hấp dẫn' },
    ];

    const categories = [];
    for (const cat of categoriesData) {
        const createdCat = await prisma.category.create({ data: cat });
        categories.push(createdCat);
    }
    console.log('Đã tạo', categories.length, 'danh mục!');

    // 3. Tạo sản phẩm mẫu
    console.log('Đang tạo sản phẩm mẫu...');
    const productsData = [
        {
            name: 'Cà Phê Đen Đá',
            slug: 'ca-phe-den-da',
            description: 'Cà phê nguyên chất, pha phin truyền thống mang lại hương vị đậm đà mạnh mẽ.',
            price: 25000,
            imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
            stock: 100,
            categoryId: categories.find(c => c.slug === 'ca-phe-truyen-thong')!.id,
        },
        {
            name: 'Cà Phê Sữa Đá',
            slug: 'ca-phe-sua-da',
            description: 'Sự hòa quyện hoàn hảo giữa cà phê đậm đà và sữa đặc ngọt ngào.',
            price: 29000,
            imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=800&q=80',
            stock: 100,
            categoryId: categories.find(c => c.slug === 'ca-phe-truyen-thong')!.id,
        },
        {
            name: 'Bạc Xỉu',
            slug: 'bac-xiu',
            description: 'Nhiều sữa, ít cà phê, phù hợp cho những ai thích vị ngọt ngào béo ngậy.',
            price: 32000,
            imageUrl: 'https://images.unsplash.com/photo-1579992357154-faf4bde95b3d?w=800&q=80',
            stock: 100,
            categoryId: categories.find(c => c.slug === 'ca-phe-truyen-thong')!.id,
        },
        {
            name: 'Cappuccino',
            slug: 'cappuccino',
            description: 'Cà phê Espresso pha với lượng sữa nóng và bọt sữa bằng nhau.',
            price: 45000,
            imageUrl: 'https://images.unsplash.com/photo-1534687941688-651ccaafbff8?w=800&q=80',
            stock: 50,
            categoryId: categories.find(c => c.slug === 'ca-phe-y')!.id,
        },
        {
            name: 'Trà Đào Cam Sả',
            slug: 'tra-dao-cam-sa',
            description: 'Thức uống thanh mát giải nhiệt mùa hè với đào miếng ngọt lịm.',
            price: 42000,
            imageUrl: 'https://images.unsplash.com/photo-1629208354714-3652db7dffed?w=800&q=80',
            stock: 80,
            categoryId: categories.find(c => c.slug === 'tra-trai-cay')!.id,
        },
        {
            name: 'Trà Vải',
            slug: 'tra-vai',
            description: 'Trà đen thanh mát kết hợp cùng những quả vải ngâm ngọt ngào.',
            price: 40000,
            imageUrl: 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&q=80',
            stock: 80,
            categoryId: categories.find(c => c.slug === 'tra-trai-cay')!.id,
        },
        {
            name: 'Trà Sữa Trân Châu Đường Đen',
            slug: 'tra-sua-tran-chau-duong-den',
            description: 'Trà sữa đậm vị hồng trà cùng trân châu dai giòn thấm đẫm sốt đường đen.',
            price: 45000,
            imageUrl: 'https://images.unsplash.com/photo-1601002937746-fc9ee9db490a?w=800&q=80',
            stock: 100,
            categoryId: categories.find(c => c.slug === 'tra-sua')!.id,
        },
        {
            name: 'Sinh Tố Bơ',
            slug: 'sinh-to-bo',
            description: 'Sinh tố bơ Đắk Lắk béo ngậy, giàu dinh dưỡng.',
            price: 45000,
            imageUrl: 'https://images.unsplash.com/photo-1602534571988-c7ea5d944111?w=800&q=80',
            stock: 30,
            categoryId: categories.find(c => c.slug === 'sinh-to-nuoc-ep')!.id,
        },
        {
            name: 'Bánh Tiramisu',
            slug: 'banh-tiramisu',
            description: 'Bánh ngọt phong cách Ý với vị cà phê và cacao quyến rũ.',
            price: 35000,
            imageUrl: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=800&q=80',
            stock: 20,
            categoryId: categories.find(c => c.slug === 'banh-ngot-do-an-vat')!.id,
        },
        {
            name: 'Hạt Hướng Dương',
            slug: 'hat-huong-duong',
            description: 'Hạt hướng dương rang muối giòn rụm.',
            price: 15000,
            imageUrl: 'https://images.unsplash.com/photo-1522856339183-49d7f0221379?w=800&q=80',
            stock: 200,
            categoryId: categories.find(c => c.slug === 'banh-ngot-do-an-vat')!.id,
        }
    ];

    let createdProducts = 0;
    for (const p of productsData) {
        await prisma.product.create({ data: p });
        createdProducts++;
    }

    console.log(`Đã tạo thành công ${createdProducts} sản phẩm mẫu!`);
    console.log('=== HOÀN TẤT ===');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
