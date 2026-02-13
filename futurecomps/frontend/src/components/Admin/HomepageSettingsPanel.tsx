import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Separator } from "@/components/ui/Separator";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Trash2, Edit, Image } from "lucide-react";
import homepageService, {
  type HomepageSettings,
  type CarouselItem,
} from "@/api/services/homepageService";
import productService from "@/api/services/productService";
// Product type is defined in the API service
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Textarea } from "@/components/ui/Textarea";

export default function HomepageSettingsPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isAddCarouselItemOpen, setIsAddCarouselItemOpen] = useState(false);
  const [isEditCarouselItemOpen, setIsEditCarouselItemOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [selectedCarouselItem, setSelectedCarouselItem] =
    useState<CarouselItem | null>(null);
  const [newCarouselItem, setNewCarouselItem] = useState<Partial<CarouselItem>>(
    {
      title: "",
      subTitle: "",
      description: "",
      mainImage: "",
      detailImage: "",
      lightBackground: "#F5F5F7",
      darkBackground: "#0A0A0B",
      accentColor: "#6E44FF",
      darkAccentColor: "#8F6FFF",
      material: "",
      model: "",
      collection: "",
      displayOrder: 0,
    },
  );

  // Fetch homepage settings and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch homepage settings
        const homepageSettings = await homepageService.getHomepageSettings();
        setSettings(homepageSettings);

        // Fetch products for carousel selection
        const productsData = await productService.getProducts({
          limit: 100,
          page: 1,
        });

        // Convert from API Product type to our Product type
        setProducts(productsData.products || ([] as any));
      } catch (error) {
        console.error("Error fetching homepage settings:", error);
        toast({
          title: "Error",
          description: "Failed to load homepage settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Handle saving homepage settings
  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      await homepageService.updateHomepageSettings(settings);

      toast({
        title: "Success",
        description: "Homepage settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving homepage settings:", error);
      toast({
        title: "Error",
        description: "Failed to save homepage settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle adding a product to carousel
  const handleAddToCarousel = async () => {
    if (!selectedProduct || !settings) return;

    try {
      setSaving(true);

      // Find the selected product
      const product = products.find((p) => p._id === selectedProduct);
      if (!product) {
        throw new Error("Selected product not found");
      }

      // Create carousel item
      const carouselItem: Partial<CarouselItem> = {
        ...newCarouselItem,
        productId: product._id,
        title: newCarouselItem.title || product.name,
        subTitle: newCarouselItem.subTitle || product.category || "COLLECTION",
        description: newCarouselItem.description || product.description || "",
        mainImage:
          newCarouselItem.mainImage ||
          (product.images && product.images.length > 0
            ? product.images[0]
            : ""),
        detailImage:
          newCarouselItem.detailImage ||
          (product.images && product.images.length > 1
            ? product.images[1]
            : product.images?.[0] || ""),
        price: `$${product.price.toFixed(2)}`,
        model: newCarouselItem.model || `MODEL.${product._id.substring(0, 2)}`,
        collection:
          newCarouselItem.collection || product.category || "COLLECTION",
        material: newCarouselItem.material || "Premium Material",
        displayOrder: settings.carousel.items.length,
      };

      // Add to carousel
      const addedItem =
        await homepageService.addProductToCarousel(carouselItem);

      // Update local state
      setSettings({
        ...settings,
        carousel: {
          ...settings.carousel,
          items: [...settings.carousel.items, addedItem],
        },
      });

      // Reset form
      setSelectedProduct("");
      setNewCarouselItem({
        title: "",
        subTitle: "",
        description: "",
        mainImage: "",
        detailImage: "",
        lightBackground: "#F5F5F7",
        darkBackground: "#0A0A0B",
        accentColor: "#6E44FF",
        darkAccentColor: "#8F6FFF",
        material: "",
        model: "",
        collection: "",
        displayOrder: 0,
      });

      // Close dialog
      setIsAddCarouselItemOpen(false);

      toast({
        title: "Success",
        description: "Product added to carousel",
      });
    } catch (error) {
      console.error("Error adding product to carousel:", error);
      toast({
        title: "Error",
        description: "Failed to add product to carousel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle editing a carousel item
  const handleEditCarouselItem = (item: CarouselItem) => {
    setSelectedCarouselItem(item);
    setIsEditCarouselItemOpen(true);
  };

  // Handle saving edited carousel item
  const handleSaveEditedCarouselItem = async () => {
    if (!selectedCarouselItem || !settings) return;

    try {
      setSaving(true);

      // Update carousel item
      const updatedItem = await homepageService.updateCarouselItem(
        selectedCarouselItem.productId,
        selectedCarouselItem,
      );

      // Update local state
      setSettings({
        ...settings,
        carousel: {
          ...settings.carousel,
          items: settings.carousel.items.map((item) =>
            item.productId === updatedItem.productId ? updatedItem : item,
          ),
        },
      });

      // Close dialog
      setIsEditCarouselItemOpen(false);
      setSelectedCarouselItem(null);

      toast({
        title: "Success",
        description: "Carousel item updated successfully",
      });
    } catch (error) {
      console.error("Error updating carousel item:", error);
      toast({
        title: "Error",
        description: "Failed to update carousel item",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle removing a product from carousel
  const handleRemoveFromCarousel = async (productId: string) => {
    if (!settings) return;

    try {
      setSaving(true);

      // Remove from carousel
      await homepageService.removeProductFromCarousel(productId);

      // Update local state
      setSettings({
        ...settings,
        carousel: {
          ...settings.carousel,
          items: settings.carousel.items.filter(
            (item) => item.productId !== productId,
          ),
        },
      });

      toast({
        title: "Success",
        description: "Product removed from carousel",
      });
    } catch (error) {
      console.error("Error removing product from carousel:", error);
      toast({
        title: "Error",
        description: "Failed to remove product from carousel",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Handle updating carousel settings
  const handleCarouselSettingsChange = (key: string, value: any) => {
    if (!settings) return;

    setSettings({
      ...settings,
      carousel: {
        ...settings.carousel,
        [key]: value,
      },
    });
  };

  // Handle updating new arrivals count
  const handleNewArrivalsCountChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!settings) return;

    const count = parseInt(e.target.value);
    if (isNaN(count)) return;

    setSettings({
      ...settings,
      newArrivalsCount: count,
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading homepage settings...</span>
      </div>
    );
  }

  // If settings failed to load
  if (!settings) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-500">Failed to load homepage settings</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Homepage Settings</h2>
        <p className="text-gray-500">
          Manage your homepage content and appearance
        </p>
      </div>

      <Tabs defaultValue="carousel">
        <TabsList className="mb-4">
          <TabsTrigger value="carousel">Carousel</TabsTrigger>
          <TabsTrigger value="newArrivals">New Arrivals</TabsTrigger>
          <TabsTrigger value="other">Other Sections</TabsTrigger>
        </TabsList>

        <TabsContent value="carousel">
          <Card>
            <CardHeader>
              <CardTitle>Carousel Settings</CardTitle>
              <CardDescription>
                Manage the products displayed in the homepage carousel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autoplay</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically rotate through carousel items
                  </p>
                </div>
                <Switch
                  checked={settings.carousel.autoplay}
                  onCheckedChange={(checked) =>
                    handleCarouselSettingsChange("autoplay", checked)
                  }
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="autoplaySpeed">Autoplay Speed (ms)</Label>
                <Input
                  id="autoplaySpeed"
                  type="number"
                  value={settings.carousel.autoplaySpeed}
                  onChange={(e) =>
                    handleCarouselSettingsChange(
                      "autoplaySpeed",
                      parseInt(e.target.value),
                    )
                  }
                  min={1000}
                  step={500}
                />
                <p className="text-sm text-muted-foreground">
                  Time in milliseconds between slides (minimum 1000ms)
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Carousel Items</h3>
                  <Dialog
                    open={isAddCarouselItemOpen}
                    onOpenChange={(open) => {
                      setIsAddCarouselItemOpen(open);
                      // Add a small delay to ensure the dialog is fully closed
                      if (!open) {
                        setTimeout(() => {
                          // Reset form data when dialog is closed
                          setSelectedProduct("");
                          setNewCarouselItem({
                            title: "",
                            subTitle: "",
                            description: "",
                            mainImage: "",
                            detailImage: "",
                            lightBackground: "#F5F5F7",
                            darkBackground: "#0A0A0B",
                            accentColor: "#6E44FF",
                            darkAccentColor: "#8F6FFF",
                            material: "",
                            model: "",
                            collection: "",
                            displayOrder: 0,
                          });
                        }, 300);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button size="sm" className="flex items-center gap-1">
                        <Plus className="h-4 w-4" />
                        Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Add Product to Carousel</DialogTitle>
                        <DialogDescription>
                          Select a product and customize how it appears in the
                          carousel
                        </DialogDescription>
                      </DialogHeader>

                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="product">Select Product</Label>
                          <Select
                            value={selectedProduct}
                            onValueChange={setSelectedProduct}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem
                                  key={product._id}
                                  value={product._id}
                                >
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={newCarouselItem.title}
                              onChange={(e) =>
                                setNewCarouselItem({
                                  ...newCarouselItem,
                                  title: e.target.value,
                                })
                              }
                              placeholder="Product title (optional)"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="subTitle">Subtitle</Label>
                            <Input
                              id="subTitle"
                              value={newCarouselItem.subTitle}
                              onChange={(e) =>
                                setNewCarouselItem({
                                  ...newCarouselItem,
                                  subTitle: e.target.value,
                                })
                              }
                              placeholder="Subtitle (optional)"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={newCarouselItem.description}
                            onChange={(e) =>
                              setNewCarouselItem({
                                ...newCarouselItem,
                                description: e.target.value,
                              })
                            }
                            placeholder="Short description (optional)"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mainImage">Main Image URL</Label>
                            <Input
                              id="mainImage"
                              value={newCarouselItem.mainImage}
                              onChange={(e) =>
                                setNewCarouselItem({
                                  ...newCarouselItem,
                                  mainImage: e.target.value,
                                })
                              }
                              placeholder="Leave empty to use product image"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="detailImage">
                              Detail Image URL
                            </Label>
                            <Input
                              id="detailImage"
                              value={newCarouselItem.detailImage}
                              onChange={(e) =>
                                setNewCarouselItem({
                                  ...newCarouselItem,
                                  detailImage: e.target.value,
                                })
                              }
                              placeholder="Leave empty to use product image"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="accentColor">Accent Color</Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="accentColor"
                                type="color"
                                value={newCarouselItem.accentColor}
                                onChange={(e) =>
                                  setNewCarouselItem({
                                    ...newCarouselItem,
                                    accentColor: e.target.value,
                                  })
                                }
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={newCarouselItem.accentColor}
                                onChange={(e) =>
                                  setNewCarouselItem({
                                    ...newCarouselItem,
                                    accentColor: e.target.value,
                                  })
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="darkAccentColor">
                              Dark Mode Accent
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="darkAccentColor"
                                type="color"
                                value={newCarouselItem.darkAccentColor}
                                onChange={(e) =>
                                  setNewCarouselItem({
                                    ...newCarouselItem,
                                    darkAccentColor: e.target.value,
                                  })
                                }
                                className="w-12 h-10 p-1"
                              />
                              <Input
                                value={newCarouselItem.darkAccentColor}
                                onChange={(e) =>
                                  setNewCarouselItem({
                                    ...newCarouselItem,
                                    darkAccentColor: e.target.value,
                                  })
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="collection">Collection</Label>
                            <Input
                              id="collection"
                              value={newCarouselItem.collection}
                              onChange={(e) =>
                                setNewCarouselItem({
                                  ...newCarouselItem,
                                  collection: e.target.value,
                                })
                              }
                              placeholder="Collection name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input
                              id="model"
                              value={newCarouselItem.model}
                              onChange={(e) =>
                                setNewCarouselItem({
                                  ...newCarouselItem,
                                  model: e.target.value,
                                })
                              }
                              placeholder="Model number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="material">Material</Label>
                            <Input
                              id="material"
                              value={newCarouselItem.material}
                              onChange={(e) =>
                                setNewCarouselItem({
                                  ...newCarouselItem,
                                  material: e.target.value,
                                })
                              }
                              placeholder="Material type"
                            />
                          </div>
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAddCarouselItemOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleAddToCarousel}
                          disabled={!selectedProduct || saving}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Adding...
                            </>
                          ) : (
                            "Add to Carousel"
                          )}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {settings.carousel.items.length === 0 ? (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <Image className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No items in carousel. Add products to display them on the
                      homepage.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {settings.carousel.items.map((item) => (
                      <div
                        key={item.productId}
                        className="border rounded-lg p-4 flex items-start gap-4"
                      >
                        <div
                          className="w-20 h-20 bg-cover bg-center rounded-md flex-shrink-0"
                          style={{ backgroundImage: `url(${item.mainImage})` }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{item.title}</h4>
                          <p className="text-sm text-gray-500 truncate">
                            {item.subTitle}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => handleEditCarouselItem(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() =>
                                handleRemoveFromCarousel(item.productId)
                              }
                              disabled={saving}
                            >
                              {saving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="newArrivals">
          <Card>
            <CardHeader>
              <CardTitle>New Arrivals Settings</CardTitle>
              <CardDescription>
                Configure the New Arrivals section on the homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newArrivalsCount">
                  Number of Products to Display
                </Label>
                <Input
                  id="newArrivalsCount"
                  type="number"
                  value={settings.newArrivalsCount}
                  onChange={handleNewArrivalsCountChange}
                  min={1}
                  max={12}
                />
                <p className="text-sm text-muted-foreground">
                  How many new products to show in the New Arrivals section
                  (1-12)
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="other">
          <Card>
            <CardHeader>
              <CardTitle>Other Homepage Sections</CardTitle>
              <CardDescription>
                Configure additional homepage sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Additional homepage section settings will be available in a
                future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Carousel Item Dialog */}
      <Dialog
        open={isEditCarouselItemOpen}
        onOpenChange={(open) => {
          setIsEditCarouselItemOpen(open);
          // Add a small delay to ensure the dialog is fully closed
          if (!open) {
            setTimeout(() => {
              setSelectedCarouselItem(null);
            }, 300);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Carousel Item</DialogTitle>
            <DialogDescription>
              Update the carousel item details
            </DialogDescription>
          </DialogHeader>
          {selectedCarouselItem && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedCarouselItem.title}
                  onChange={(e) =>
                    setSelectedCarouselItem({
                      ...selectedCarouselItem,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-subTitle">Subtitle</Label>
                <Input
                  id="edit-subTitle"
                  value={selectedCarouselItem.subTitle}
                  onChange={(e) =>
                    setSelectedCarouselItem({
                      ...selectedCarouselItem,
                      subTitle: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedCarouselItem.description}
                  onChange={(e) =>
                    setSelectedCarouselItem({
                      ...selectedCarouselItem,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-mainImage">Main Image URL</Label>
                  <Input
                    id="edit-mainImage"
                    value={selectedCarouselItem.mainImage}
                    onChange={(e) =>
                      setSelectedCarouselItem({
                        ...selectedCarouselItem,
                        mainImage: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-detailImage">Detail Image URL</Label>
                  <Input
                    id="edit-detailImage"
                    value={selectedCarouselItem.detailImage}
                    onChange={(e) =>
                      setSelectedCarouselItem({
                        ...selectedCarouselItem,
                        detailImage: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-lightBackground">Light Background</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-lightBackground"
                      value={selectedCarouselItem.lightBackground}
                      onChange={(e) =>
                        setSelectedCarouselItem({
                          ...selectedCarouselItem,
                          lightBackground: e.target.value,
                        })
                      }
                    />
                    <div
                      className="w-8 h-8 rounded-md border"
                      style={{
                        backgroundColor: selectedCarouselItem.lightBackground,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-darkBackground">Dark Background</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-darkBackground"
                      value={selectedCarouselItem.darkBackground}
                      onChange={(e) =>
                        setSelectedCarouselItem({
                          ...selectedCarouselItem,
                          darkBackground: e.target.value,
                        })
                      }
                    />
                    <div
                      className="w-8 h-8 rounded-md border"
                      style={{
                        backgroundColor: selectedCarouselItem.darkBackground,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-accentColor">Accent Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-accentColor"
                      value={selectedCarouselItem.accentColor}
                      onChange={(e) =>
                        setSelectedCarouselItem({
                          ...selectedCarouselItem,
                          accentColor: e.target.value,
                        })
                      }
                    />
                    <div
                      className="w-8 h-8 rounded-md border"
                      style={{
                        backgroundColor: selectedCarouselItem.accentColor,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-darkAccentColor">
                    Dark Accent Color
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="edit-darkAccentColor"
                      value={selectedCarouselItem.darkAccentColor}
                      onChange={(e) =>
                        setSelectedCarouselItem({
                          ...selectedCarouselItem,
                          darkAccentColor: e.target.value,
                        })
                      }
                    />
                    <div
                      className="w-8 h-8 rounded-md border"
                      style={{
                        backgroundColor: selectedCarouselItem.darkAccentColor,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-model">Model</Label>
                  <Input
                    id="edit-model"
                    value={selectedCarouselItem.model}
                    onChange={(e) =>
                      setSelectedCarouselItem({
                        ...selectedCarouselItem,
                        model: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-collection">Collection</Label>
                  <Input
                    id="edit-collection"
                    value={selectedCarouselItem.collection}
                    onChange={(e) =>
                      setSelectedCarouselItem({
                        ...selectedCarouselItem,
                        collection: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-material">Material</Label>
                <Input
                  id="edit-material"
                  value={selectedCarouselItem.material}
                  onChange={(e) =>
                    setSelectedCarouselItem({
                      ...selectedCarouselItem,
                      material: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditCarouselItemOpen(false);
                setSelectedCarouselItem(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEditedCarouselItem}
              disabled={!selectedCarouselItem || saving}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
