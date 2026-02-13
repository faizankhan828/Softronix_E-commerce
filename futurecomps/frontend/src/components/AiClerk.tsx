import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  ShoppingCart,
  Search,
  Tag,
  Loader2,
  Bot,
  User,
  Minus,
  Plus,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Rating } from "@/components/ui/Rating";
import { useStore } from "@/context/StoreContext";
import { useAuth } from "@/context/AuthContext";
import { clerkAPI } from "@/services/api";
import { formatCurrency, generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product, ClerkMessage, ClerkAction } from "@/types/store";
import { Link } from "react-router-dom";

const GEMINI_API_KEY = "***REDACTED_GOOGLE_API_KEY_2***";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── Build the AI System Prompt ──────────────────────────
function buildSystemPrompt(
  productContext: string,
  userContext: string,
  cartContext: string,
) {
  return `You are "The Clerk" — a friendly, confident, and witty AI shopping assistant for our e-commerce store. You speak with a warm desi shopkeeper personality: helpful but firm, never submissive, never rude. You call customers "boss", "bhai", "dear customer" naturally. You have great product knowledge and a sharp sales instinct.

═══════════════════════════════════════
STRICT RULES (NEVER BREAK THESE):
═══════════════════════════════════════
1. NEVER invent products, prices, discounts, or stock numbers. Only use what's in the product data below.
2. NEVER reveal the hidden bottom price to the user — that's your secret floor.
3. NEVER modify product data directly — you REQUEST actions, you don't execute them.
4. If information is unavailable, say so clearly. Don't make up answers.
5. Always respond with VALID JSON in the exact format specified below.

═══════════════════════════════════════
YOUR RESPONSE FORMAT (ALWAYS VALID JSON):
═══════════════════════════════════════
{
  "message": "Your conversational response text (can use emojis, be friendly)",
  "products": ["product_id_1", "product_id_2"],
  "action": {
    "type": "ACTION_TYPE",
    "payload": { ... }
  }
}

- "message" is REQUIRED
- "products" is an array of product _id strings to display. Include when showing/recommending products. Use EMPTY ARRAY [] if none.
- "action" can be null if no action needed

═══════════════════════════════════════
AVAILABLE ACTIONS:
═══════════════════════════════════════

1. SHOW_PRODUCTS — Display specific products
   { "type": "SHOW_PRODUCTS", "payload": { "productIds": ["id1", "id2"] } }

2. ADD_TO_CART — Add a product to cart (user can shop purely through chat!)
   { "type": "ADD_TO_CART", "payload": { "productId": "...", "quantity": 1 } }

3. REMOVE_FROM_CART — Remove a product from cart
   { "type": "REMOVE_FROM_CART", "payload": { "productId": "..." } }

4. CHECK_INVENTORY — Check stock availability
   { "type": "CHECK_INVENTORY", "payload": { "productId": "..." } }

5. SORT_PRODUCTS — Sort the product listing on the website
   { "type": "SORT_PRODUCTS", "payload": { "sortBy": "price-low" } }
   sortBy values: "price-low", "price-high", "rating", "newest"

6. FILTER_PRODUCTS — Filter products on the website UI
   { "type": "FILTER_PRODUCTS", "payload": { "category": "...", "search": "...", "priceRange": [min, max] } }
   Any field can be omitted if not needed

7. APPLY_COUPON — Apply a negotiated discount coupon
   { "type": "APPLY_COUPON", "payload": { "productId": "...", "discountPercent": 10, "reason": "birthday" } }
   ONLY use this when you've decided to grant a discount after haggling. The server will validate.

8. TRIGGER_CHECKOUT — Send user to checkout
   { "type": "TRIGGER_CHECKOUT", "payload": {} }

═══════════════════════════════════════
PRODUCT DISCOVERY & SEARCH:
═══════════════════════════════════════
- Understand user intent: occasion, vibe, budget, style
- "I need an outfit for a summer wedding in Italy" → show light linens, sunglasses, NOT winter coats
- "Show me something cheap" → SORT by price-low AND FILTER_PRODUCTS
- "Show me cheaper options" → trigger SORT_PRODUCTS with "price-low" so the website UI updates instantly
- Select ONLY relevant products, exclude unrelated ones
- When showing products, ALWAYS include the product IDs in the "products" array

═══════════════════════════════════════
THE "NO MENU" RULE:
═══════════════════════════════════════
A user MUST be able to find and buy a product WITHOUT clicking ANY button.
- They say "add that blue jacket to my cart" → you use ADD_TO_CART
- They say "I want to check out" → you use TRIGGER_CHECKOUT
- They say "remove the shoes" → you use REMOVE_FROM_CART
The entire shopping journey happens through conversation!

═══════════════════════════════════════
SALES AGENT — RECOMMENDATIONS:
═══════════════════════════════════════
- Recommend products based on user's past purchases and viewed items
- Cross-sell: "You're getting the jacket? This scarf would look AMAZING with it!"
- Upsell tastefully: "We also have a premium version with leather trim"
- Use purchase history to personalize: "I see you love accessories, check these out!"

═══════════════════════════════════════
HAGGLE MODE 🤝 (Negotiation/Bargaining):
═══════════════════════════════════════
When a user asks for a discount, you are a TOUGH BUT FAIR negotiator:

EVALUATE the user's approach:
• POLITE REQUEST ("Can I get a small discount?"): Offer 5-10%
• GOOD REASON ("It's my birthday" / "I'm buying two" / "I'm a student"): Offer 10-15%
• BULK ORDER ("I want 3 of these"): Offer 10-20%
• RUDE/DEMANDING ("Give me 50% off or I leave!"): RAISE the price playfully or refuse firmly
  "Bhai, with that attitude, the price just went up 5%! 😄 Try asking nicely."
• LOWBALL ("Give me 90% off"): Refuse with personality
  "Boss, I have a family to feed too! 😅 Best I can do is maybe 10%..."

COUPON GENERATION:
- When you decide to give a discount, use APPLY_COUPON action
- The server will validate that the discount doesn't go below the hidden bottom price
- If the server rejects it (too steep), offer a smaller discount
- Each coupon is single-use, expires in 24 hours

PERSONALITY DURING HAGGLING:
- Be like a desi shopkeeper: "Arre boss, you're killing me here! Fine, since it's your birthday... 🎂"
- Have a SPINE — don't cave immediately
- Start negotiations conservatively, let user talk you up
- Make the user feel they WON something

═══════════════════════════════════════
INVENTORY HANDLING:
═══════════════════════════════════════
- Answer stock questions strictly from data
- "Do you have this in blue?" → check attributes.colors
- If out of stock, suggest closest alternative that IS in stock
- Never promise availability you can't confirm

═══════════════════════════════════════
PRODUCT DATA (YOUR INVENTORY):
═══════════════════════════════════════
${productContext}

═══════════════════════════════════════
USER CONTEXT:
═══════════════════════════════════════
${userContext}

═══════════════════════════════════════
CURRENT CART:
═══════════════════════════════════════
${cartContext}

═══════════════════════════════════════
REMEMBER: Always respond with VALID JSON. Keep "message" conversational and engaging. Be helpful but have personality!`;
}

// ── Product Card Component ──────────────────────────────
interface ProductCardInChatProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCardInChat({ product, onAddToCart }: ProductCardInChatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-all"
    >
      <Link to={`/product/${product._id}`} className="shrink-0">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-lg hover:opacity-90 transition-opacity"
        />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${product._id}`}
          className="font-medium text-sm hover:text-primary transition-colors line-clamp-1 flex items-center gap-1"
        >
          {product.name}
          <ExternalLink className="w-3 h-3 opacity-50" />
        </Link>
        <div className="flex items-center gap-1 mt-0.5">
          <Rating value={product.rating} size="sm" />
          <span className="text-xs text-muted-foreground">
            ({product.reviewCount} reviews)
          </span>
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-sm">
              {formatCurrency(
                product.discountedPrice || product.price,
                product.currency,
              )}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.originalPrice, product.currency)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {product.stock > 0 ? (
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                In Stock
              </span>
            ) : (
              <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">
                Out of Stock
              </span>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => onAddToCart(product)}
              disabled={product.stock <= 0}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {product.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Robust JSON Parser ──────────────────────────────────
function parseAIResponse(raw: string): {
  message: string;
  products?: string[];
  action?: { type: string; payload?: any };
} {
  // Strategy 1: Direct JSON parse
  try {
    const parsed = JSON.parse(raw);
    if (parsed.message) return parsed;
  } catch {}

  // Strategy 2: Extract JSON from markdown code blocks
  const codeBlockMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      const parsed = JSON.parse(codeBlockMatch[1].trim());
      if (parsed.message) return parsed;
    } catch {}
  }

  // Strategy 3: Find JSON object in text (greedy brace match)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.message) return parsed;
    } catch {
      // Try fixing common issues: trailing commas, single quotes
      try {
        const fixed = jsonMatch[0]
          .replace(/,\s*([\]}])/g, "$1") // remove trailing commas
          .replace(/'/g, '"'); // single to double quotes
        const parsed = JSON.parse(fixed);
        if (parsed.message) return parsed;
      } catch {}
    }
  }

  // Strategy 4: Plain text fallback
  return {
    message:
      raw.replace(/```[\s\S]*?```/g, "").trim() ||
      "I'm here to help! What would you like to browse?",
  };
}

// ── Main AiClerk Component ──────────────────────────────
export function AiClerk() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ClerkMessage[]>([
    {
      id: generateId(),
      role: "assistant",
      content:
        "Asslam o Alikum boss! 👋 Welcome to the shop! I'm your personal Clerk — think of me as your desi shopping buddy. I can find products, add stuff to your cart, negotiate prices, and even check you out — all through our chat! \n\nWhat are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Track user context fetched from backend
  const [userContext, setUserContext] = useState<any>(null);

  const {
    products,
    addToCart,
    removeFromCart,
    handleClerkAction,
    cart,
    setCartOpen,
  } = useStore();
  const { isAuthenticated, user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Fetch user context when chat opens (if authenticated)
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchUserContext();
    }
  }, [isOpen, isAuthenticated]);

  const fetchUserContext = async () => {
    try {
      const { data } = await clerkAPI.getUserContext();
      setUserContext(data);
    } catch (err) {
      console.warn("Could not fetch user context (may not be logged in):", err);
    }
  };

  // Build product context string for AI
  const buildProductContext = useCallback((): string => {
    const allProducts = products.length > 0 ? products : [];
    const contextProducts = allProducts.slice(0, 30).map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description?.substring(0, 100),
      price: p.price,
      discountedPrice: p.discountedPrice,
      originalPrice: p.originalPrice,
      category: p.category,
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      colors: p.colors,
      sizes: p.sizes,
      tags: p.tags,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
    }));
    return JSON.stringify(contextProducts, null, 1);
  }, [products]);

  // Build user context string for AI
  const buildUserContext = useCallback((): string => {
    if (!userContext) {
      return user ? `Logged in as: ${user.name}` : "Guest user (not logged in)";
    }
    const parts: string[] = [];
    parts.push(`User: ${userContext.userName || user?.name || "Guest"}`);
    if (userContext.purchaseHistory?.length > 0) {
      parts.push(
        `Past purchases: ${JSON.stringify(
          userContext.purchaseHistory.map((o: any) => ({
            items: o.items?.map((i: any) => i.name),
            total: o.total,
            date: o.date,
          })),
        )}`,
      );
    } else {
      parts.push("No past purchases.");
    }
    return parts.join("\n");
  }, [userContext, user]);

  // Build cart context string for AI
  const buildCartContext = useCallback((): string => {
    if (cart.items.length === 0) return "Cart is empty.";
    const items = cart.items.map((item) => ({
      productId: item.productId,
      name: item.product?.name,
      price: item.product?.price,
      quantity: item.quantity,
      size: item.size,
      color: item.color,
    }));
    return `Items: ${JSON.stringify(items)}\nSubtotal: $${cart.subtotal.toFixed(2)}\nDiscount: $${cart.discount.toFixed(2)}\nTotal: $${cart.total.toFixed(2)}${cart.discountCode ? `\nCoupon applied: ${cart.discountCode}` : ""}`;
  }, [cart]);

  // Find products from local state by IDs
  const findProductsByIds = useCallback(
    (ids: string[]): Product[] => {
      return ids
        .map((id) => products.find((p) => p._id === id))
        .filter(Boolean) as Product[];
    },
    [products],
  );

  // Find products from local state by query
  const findProductsByQuery = useCallback(
    (query: string): Product[] => {
      const searchLower = query.toLowerCase();
      return products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.category.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags?.some((t) => t.toLowerCase().includes(searchLower)),
        )
        .slice(0, 6);
    },
    [products],
  );

  // Find a product by ID
  const findProductById = useCallback(
    (id: string): Product | undefined => {
      return products.find((p) => p._id === id);
    },
    [products],
  );

  // ── Handle AI Action Execution ──────────────────────────
  const executeAction = useCallback(
    async (
      action: { type: string; payload?: any },
    ): Promise<{ extraMessage?: string; extraProducts?: Product[] }> => {
      const type = action.type?.toUpperCase?.() || action.type;
      const payload = action.payload || {};

      try {
        switch (type) {
          case "SHOW_PRODUCTS": {
            const ids = payload.productIds || payload.ProductIDs || [];
            if (ids.length > 0) {
              handleClerkAction({ type: "show_products", payload: {} });
              return { extraProducts: findProductsByIds(ids) };
            }
            handleClerkAction({ type: "show_products", payload: {} });
            return {};
          }

          case "ADD_TO_CART": {
            const productId = payload.productId || payload.ProductID;
            const quantity = payload.quantity || payload.Quantity || 1;
            const product = findProductById(productId);
            if (product) {
              addToCart(product, quantity, payload.size, payload.color);
              return {
                extraMessage: `✅ Added "${product.name}" (x${quantity}) to your cart!`,
              };
            }
            return {
              extraMessage:
                "⚠️ Couldn't find that product to add. Could you try again?",
            };
          }

          case "REMOVE_FROM_CART": {
            const productId = payload.productId || payload.ProductID;
            if (productId) {
              removeFromCart(productId);
              return { extraMessage: "🗑️ Removed from your cart!" };
            }
            return {};
          }

          case "CHECK_INVENTORY": {
            const productId = payload.productId || payload.ProductID;
            if (productId && isAuthenticated) {
              try {
                const { data } = await clerkAPI.inventoryCheck({ productId });
                const p = data.product;
                if (p) {
                  const stockMsg = p.inStock
                    ? `✅ "${p.name}" is in stock (${p.stock} available). Colors: ${p.availableColors?.join(", ") || "N/A"}. Sizes: ${p.availableSizes?.join(", ") || "N/A"}.`
                    : `❌ Sorry, "${p.name}" is currently out of stock.`;
                  return { extraMessage: stockMsg };
                }
              } catch {
                // Fallback to local data
                const product = findProductById(productId);
                if (product) {
                  return {
                    extraMessage:
                      product.stock > 0
                        ? `✅ "${product.name}" is in stock (${product.stock} available).`
                        : `❌ "${product.name}" is out of stock.`,
                  };
                }
              }
            }
            return {};
          }

          case "SORT_PRODUCTS": {
            const sortBy = payload.sortBy || payload.SortBy;
            if (sortBy) {
              // Map AI sort values to our sort options
              const sortMap: Record<string, string> = {
                price: "price-low",
                "price-low": "price-low",
                "price-high": "price-high",
                rating: "rating",
                newest: "newest",
              };
              const mappedSort = sortMap[sortBy] || sortBy;
              handleClerkAction({
                type: "sort_products",
                payload: { sortBy: mappedSort },
              });
              return {
                extraMessage: `🔄 Website updated! Products sorted by ${mappedSort}.`,
              };
            }
            return {};
          }

          case "FILTER_PRODUCTS": {
            handleClerkAction({
              type: "filter_products",
              payload: {
                category: payload.category || payload.Condition,
                search: payload.search,
                priceRange: payload.priceRange,
              },
            });
            return { extraMessage: "🔍 Website filters updated!" };
          }

          case "APPLY_COUPON": {
            const productId = payload.productId || payload.ProductID;
            const discountPercent =
              payload.discountPercent ||
              payload.DiscountPercent ||
              payload.percentage ||
              10;
            const reason = payload.reason || payload.CouponCode || "negotiated";

            if (!productId) {
              // Apply as a general discount
              handleClerkAction({
                type: "apply_discount",
                payload: {
                  code: `DEAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                  percentage: discountPercent,
                },
              });
              return {
                extraMessage: `🎉 ${discountPercent}% discount applied to your cart!`,
              };
            }

            // Try to generate a real coupon via backend
            if (isAuthenticated) {
              try {
                const { data } = await clerkAPI.generateCoupon({
                  productId,
                  discountType: "percentage",
                  discountValue: discountPercent,
                  reason,
                });
                // Apply the coupon
                handleClerkAction({
                  type: "apply_discount",
                  payload: {
                    code: data.couponCode,
                    percentage: discountPercent,
                  },
                });
                return {
                  extraMessage: `🎉 Coupon ${data.couponCode} generated! ${discountPercent}% off — you save $${data.discountAmount?.toFixed(2)}! Effective price: $${data.effectivePrice?.toFixed(2)}. This coupon expires in 24 hours.`,
                };
              } catch (err: any) {
                const serverMsg = err.response?.data?.message;
                const maxDiscount = err.response?.data?.maxPercentage;
                if (maxDiscount) {
                  return {
                    extraMessage: `⚠️ ${serverMsg} The maximum I can offer is ${maxDiscount}%. Want me to try that instead?`,
                  };
                }
                // Fallback: apply as client-side discount
                handleClerkAction({
                  type: "apply_discount",
                  payload: {
                    code: `DEAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                    percentage: Math.min(discountPercent, 10),
                  },
                });
                return {
                  extraMessage: `🎉 Applied a ${Math.min(discountPercent, 10)}% discount!`,
                };
              }
            } else {
              // Not authenticated — apply client-side
              handleClerkAction({
                type: "apply_discount",
                payload: {
                  code: `WELCOME-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                  percentage: Math.min(discountPercent, 10),
                },
              });
              return {
                extraMessage: `🎉 ${Math.min(discountPercent, 10)}% discount applied! Log in for even better deals!`,
              };
            }
          }

          case "TRIGGER_CHECKOUT": {
            if (cart.items.length === 0) {
              return {
                extraMessage:
                  "🛒 Your cart is empty! Add some items first, then I'll take you to checkout.",
              };
            }
            handleClerkAction({ type: "trigger_checkout", payload: {} });
            return { extraMessage: "🛍️ Redirecting you to checkout now..." };
          }

          default:
            console.warn("Unknown clerk action type:", type);
            return {};
        }
      } catch (err) {
        console.error("Action execution error:", err);
        return {
          extraMessage:
            "⚠️ Had a small hiccup executing that. Please try again!",
        };
      }
    },
    [
      handleClerkAction,
      addToCart,
      removeFromCart,
      findProductById,
      findProductsByIds,
      isAuthenticated,
      cart.items.length,
    ],
  );

  // ── Send Message ──────────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ClerkMessage = {
      id: generateId(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      // Build conversation history (last 8 messages)
      const conversationHistory = messages.slice(-8).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Build context
      const productCtx = buildProductContext();
      const userCtx = buildUserContext();
      const cartCtx = buildCartContext();
      const systemPrompt = buildSystemPrompt(productCtx, userCtx, cartCtx);

      // Call Gemini API
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemPrompt }],
            },
            {
              role: "model",
              parts: [
                {
                  text: JSON.stringify({
                    message:
                      "Ji boss, I'm ready to serve! I know all the products, I have my haggling game on, and I'm ready to help. Bring it on! 😎",
                    products: [],
                    action: null,
                  }),
                },
              ],
            },
            ...conversationHistory,
            { role: "user", parts: [{ text: currentInput }] },
          ],
          generationConfig: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("Gemini API error:", response.status, errData);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const responseText =
        data.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Parse AI response robustly
      const parsed = parseAIResponse(responseText);

      // Resolve product IDs to actual Product objects
      let displayProducts: Product[] | undefined;
      if (parsed.products && parsed.products.length > 0) {
        displayProducts = findProductsByIds(parsed.products);
        // If we couldn't match any IDs, try a text search
        if (displayProducts.length === 0) {
          displayProducts = findProductsByQuery(currentInput);
        }
      }

      // Execute action if present
      let actionResult: { extraMessage?: string; extraProducts?: Product[] } =
        {};
      let clerkAction: ClerkAction | undefined;

      if (parsed.action && parsed.action.type) {
        actionResult = await executeAction(parsed.action);
        // Map action type for storage
        const actionTypeMap: Record<string, ClerkAction["type"]> = {
          SHOW_PRODUCTS: "show_products",
          ADD_TO_CART: "add_to_cart",
          REMOVE_FROM_CART: "remove_from_cart",
          CHECK_INVENTORY: "check_inventory",
          SORT_PRODUCTS: "sort_products",
          FILTER_PRODUCTS: "filter_products",
          APPLY_COUPON: "apply_coupon",
          TRIGGER_CHECKOUT: "trigger_checkout",
        };
        clerkAction = {
          type:
            actionTypeMap[parsed.action.type.toUpperCase()] || "show_products",
          payload: parsed.action.payload,
        };
      }

      // Merge display products from action result
      if (actionResult.extraProducts && actionResult.extraProducts.length > 0) {
        displayProducts = [
          ...(displayProducts || []),
          ...actionResult.extraProducts,
        ];
        // Deduplicate
        const seen = new Set<string>();
        displayProducts = displayProducts.filter((p) => {
          if (seen.has(p._id)) return false;
          seen.add(p._id);
          return true;
        });
      }

      // Build final message
      let finalMessage = parsed.message;
      if (actionResult.extraMessage) {
        finalMessage += `\n\n${actionResult.extraMessage}`;
      }

      const assistantMessage: ClerkMessage = {
        id: generateId(),
        role: "assistant",
        content: finalMessage,
        timestamp: new Date(),
        products: displayProducts,
        action: clerkAction,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Clerk error:", error);

      // ── Smart Fallback ──────────────────────────────
      let fallbackMessage =
        "Arre yaar, my connection is acting up! 😅 Let me try to help you anyway...";
      let fallbackProducts: Product[] | undefined;
      let fallbackAction: ClerkAction | undefined;

      const inputLower = currentInput.toLowerCase();

      if (
        inputLower.includes("show") ||
        inputLower.includes("find") ||
        inputLower.includes("looking") ||
        inputLower.includes("search") ||
        inputLower.includes("browse") ||
        inputLower.includes("need") ||
        inputLower.includes("want")
      ) {
        fallbackProducts = findProductsByQuery(currentInput);
        if (fallbackProducts.length > 0) {
          fallbackMessage =
            "Here's what I found for you, boss! Take a look — click any to see more, or tell me to add one to your cart! 🛍️";
        } else {
          fallbackMessage =
            "Hmm, couldn't find an exact match for that. Let me show you our popular items instead!";
          fallbackProducts = products
            .filter((p) => p.isFeatured || p.rating >= 4)
            .slice(0, 6);
          if (fallbackProducts.length === 0)
            fallbackProducts = products.slice(0, 6);
        }
      } else if (
        inputLower.includes("discount") ||
        inputLower.includes("deal") ||
        inputLower.includes("cheaper") ||
        inputLower.includes("bargain") ||
        inputLower.includes("haggle") ||
        inputLower.includes("coupon")
      ) {
        fallbackMessage =
          "I love a good bargain conversation, boss! 🤝 Tell me what you're interested in and why you deserve a discount, and let's negotiate!";
      } else if (inputLower.includes("cart") || inputLower.includes("basket")) {
        if (cart.items.length > 0) {
          fallbackMessage = `Your cart has ${cart.items.length} item${cart.items.length > 1 ? "s" : ""} — total: $${cart.total.toFixed(2)}. Want to checkout or keep shopping?`;
        } else {
          fallbackMessage =
            "Your cart is empty, boss! Let me help you find something amazing. What are you in the mood for? 🛒";
        }
        setCartOpen(true);
      } else if (
        inputLower.includes("checkout") ||
        inputLower.includes("buy") ||
        inputLower.includes("purchase")
      ) {
        if (cart.items.length > 0) {
          handleClerkAction({ type: "trigger_checkout", payload: {} });
          fallbackMessage = "Taking you to checkout now! 🛍️";
        } else {
          fallbackMessage =
            "Cart's empty, boss! Add some items first, then we'll get you checked out. 🛒";
        }
      } else if (inputLower.includes("sort") || inputLower.includes("cheap")) {
        handleClerkAction({
          type: "sort_products",
          payload: { sortBy: "price-low" },
        });
        fallbackMessage =
          "Done! I've sorted everything by price — cheapest first. Check out the page! 🔄";
        fallbackAction = {
          type: "sort_products",
          payload: { sortBy: "price-low" },
        };
      } else if (
        inputLower.includes("hi") ||
        inputLower.includes("hello") ||
        inputLower.includes("hey")
      ) {
        fallbackMessage =
          "Hey boss! 👋 Great to have you here! What can I help you with today? Looking for something specific, or shall I show you what's trending?";
      } else {
        fallbackMessage =
          "I'm here to help, boss! You can ask me to find products, add items to your cart, get discounts, or check out — all right from this chat! What would you like to do? 😊";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: fallbackMessage,
          timestamp: new Date(),
          products: fallbackProducts,
          action: fallbackAction,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (text: string) => {
    setInput(text);
    // Use a ref-based approach to avoid race condition
    setTimeout(() => {
      const form = document.querySelector(
        "[data-clerk-form]",
      ) as HTMLFormElement;
      if (form) form.requestSubmit();
    }, 50);
  };

  const handleAddToCartFromChat = (product: Product) => {
    addToCart(product, 1);
    const addMessage: ClerkMessage = {
      id: generateId(),
      role: "assistant",
      content: `Great choice, boss! 🛍️ Added "${product.name}" to your cart. ${
        cart.items.length === 0
          ? "That's your first item — great start!"
          : `You now have ${cart.items.length + 1} items in your cart.`
      } Want to keep shopping or head to checkout?`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, addMessage]);
  };

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#2563eb] text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:brightness-110 transition-all duration-300"
          >
            <div className="relative">
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
            </div>
            <span className="font-semibold hidden sm:inline">AI Clerk</span>
            <Sparkles className="w-4 h-4 hidden sm:inline" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border overflow-hidden flex flex-col",
              isMinimized
                ? "bottom-6 right-6 w-80 h-16"
                : "bottom-6 right-6 w-[95vw] sm:w-[420px] h-[80vh] sm:h-[600px] max-h-[calc(100vh-48px)]",
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#4338ca] via-[#4f46e5] to-[#2563eb] text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Shopping Clerk</h3>
                  <p className="text-xs text-white/80">
                    {isAuthenticated
                      ? `Hey ${user?.name?.split(" ")[0] || "boss"}!`
                      : "Always here to help"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-800/50">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4338ca] to-[#2563eb] flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] space-y-3",
                          message.role === "user" ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "px-4 py-3 rounded-2xl text-sm whitespace-pre-line",
                            message.role === "user"
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-white dark:bg-gray-800 shadow-sm rounded-bl-md",
                          )}
                        >
                          {message.content}
                        </div>

                        {/* Product Cards — Rich Results */}
                        {message.products && message.products.length > 0 && (
                          <div className="space-y-2 w-full">
                            {message.products.map((product) => (
                              <ProductCardInChat
                                key={product._id}
                                product={product}
                                onAddToCart={handleAddToCartFromChat}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4338ca] to-[#2563eb] flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Thinking...
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                <div className="px-4 py-2 border-t bg-white dark:bg-gray-900 overflow-x-auto no-scrollbar">
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleQuickAction("Show me your best products")
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <Search className="w-3 h-3" />
                      Browse Products
                    </button>
                    <button
                      onClick={() =>
                        handleQuickAction(
                          "I'd love a good discount, can we negotiate?",
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <Tag className="w-3 h-3" />
                      Haggle Mode
                    </button>
                    <button
                      onClick={() => handleQuickAction("What's in my cart?")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      My Cart
                    </button>
                    <button
                      onClick={() => handleQuickAction("Take me to checkout")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <CreditCard className="w-3 h-3" />
                      Checkout
                    </button>
                  </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-900">
                  <form
                    data-clerk-form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask me anything — find products, haggle, checkout..."
                      className="flex-1"
                      disabled={isLoading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isLoading}
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
