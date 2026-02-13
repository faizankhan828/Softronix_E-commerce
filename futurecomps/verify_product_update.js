

const BASE_URL = 'http://localhost:5000/api/products';

async function runTest() {
  console.log('Starting Product Verification Test...');

  // 1. Create a Product
  const newProduct = {
    name: "Test Product " + Date.now(),
    description: "Test Description",
    price: 100,
    category: "Test Category",
    images: ["http://example.com/image1.jpg"],
    stock: 10,
    isNew: true,
    isFeatured: false
  };

  console.log('Creating product...');
  const createRes = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newProduct)
  });

  if (!createRes.ok) {
    console.error('Failed to create product:', await createRes.text());
    return;
  }

  const createdProduct = await createRes.json();
  const productId = createdProduct._id || createdProduct.id;
  console.log('Product created with ID:', productId);

  // 2. Update the Product
  const updatePayload = {
    images: ["http://example.com/image2.jpg", "http://example.com/image3.jpg"],
    imageUrl: "http://example.com/image2.jpg", // Setting primary image
    stock: 20
  };

  console.log('Updating product...');
  const updateRes = await fetch(`${BASE_URL}/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
  });

  if (!updateRes.ok) {
    console.error('Failed to update product:', await updateRes.text());
    return;
  }

  const updatedProduct = await updateRes.json();
  console.log('Update response:', updatedProduct);

  // 3. Verify the Update
  console.log('Verifying update...');
  const getRes = await fetch(`${BASE_URL}/${productId}`);
  const finalProduct = await getRes.json();

  console.log('Final Product State:');
  console.log('Stock:', finalProduct.stock);
  console.log('Images:', finalProduct.images);
  console.log('ImageUrl:', finalProduct.imageUrl);

  let success = true;
  if (finalProduct.stock !== 20) {
    console.error('FAIL: Stock not updated. Expected 20, got', finalProduct.stock);
    success = false;
  }
  if (!finalProduct.images.includes("http://example.com/image2.jpg")) {
    console.error('FAIL: Images not updated.');
    success = false;
  }
  if (finalProduct.imageUrl !== "http://example.com/image2.jpg") {
    console.error('FAIL: ImageUrl not updated. Expected http://example.com/image2.jpg, got', finalProduct.imageUrl);
    success = false;
  }

  if (success) {
    console.log('SUCCESS: Product update verified!');
  } else {
    console.log('FAILURE: Product update failed.');
  }
}

runTest().catch(console.error);
