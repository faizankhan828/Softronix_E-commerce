// Test ImageKit initialization
import pkg from "@imagekit/nodejs";
const ImageKit = pkg.default || pkg;

console.log("ImageKit package:", pkg);
console.log("ImageKit constructor:", ImageKit);
console.log("ImageKit type:", typeof ImageKit);

try {
  const testInstance = new ImageKit({
    publicKey: "public_test",
    privateKey: "private_test",
    urlEndpoint: "https://test.com",
  });

  console.log("Test instance created:", testInstance.constructor.name);
  console.log("Instance own properties:", Object.keys(testInstance));
  console.log(
    "Instance methods:",
    Object.getOwnPropertyNames(Object.getPrototypeOf(testInstance)),
  );
  console.log("Has upload:", typeof testInstance.upload);
  console.log("Has files:", typeof testInstance.files);
  console.log("Files object:", testInstance.files);

  if (testInstance.files) {
    console.log(
      "Files methods:",
      Object.getOwnPropertyNames(Object.getPrototypeOf(testInstance.files)),
    );
    console.log("Files.upload:", typeof testInstance.files.upload);
  }
} catch (error) {
  console.error("Test error:", error.message);
}
