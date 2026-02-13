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
  Maximize2,
  Minimize2,
  Camera,
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
import { Link, useLocation, useNavigate } from "react-router-dom";

const GEMINI_API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY ||
  "***REDACTED_GOOGLE_API_KEY_1***";

// Models to try in order — each has its own separate free-tier quota
// If one is rate-limited (429), we automatically try the next
const GEMINI_MODELS = [
  "gemini-3-flash-preview", // newest: works great on free tier
  "gemini-2.5-flash", // best: fast, smart, free tier
  "gemini-2.5-flash-lite", // fallback: cheapest, highest quota
  "gemini-2.0-flash-lite", // fallback: lightweight
  "gemini-2.0-flash", // original model (deprecated Mar 2026)
];

// Puter.js image generation models (free, unlimited)
// These are used via puter.ai.txt2img() loaded from https://js.puter.com/v2/
const PUTER_IMAGE_MODELS = [
  "gpt-image-1", // Best quality
  "dall-e-3", // Great quality
  "flux-schnell", // Fast
  "dall-e-2", // Fallback
];

// Declare puter global (loaded via script tag in index.html)
declare const puter: {
  ai: {
    txt2img: (
      prompt: string,
      options?: { model?: string; quality?: string; size?: string },
    ) => Promise<HTMLImageElement>;
    chat: (
      prompt: string,
      options?: { model?: string },
    ) => Promise<{ message: { content: string } }>;
  };
};
const GEMINI_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models`;
const MAX_RETRIES_PER_MODEL = 1; // try each model once before moving on
const RETRY_DELAY = 2000; // 2s between retries

// ── Build the AI System Prompt ──────────────────────────
function buildSystemPrompt(
  productContext: string,
  userContext: string,
  cartContext: string,
  pageContext: string,
  conversationProductContext: string,
) {
  return `You are "The Clerk" — a friendly, confident, and witty AI shopping assistant. Think: a sharp desi shopkeeper who knows every product by heart, reads customer vibes instantly, and NEVER lets a customer leave empty-handed.

YOUR PERSONALITY:
- Warm, confident, slightly cheeky — like a real shopkeeper who cares
- Call customers "boss", "sir", "bhai", "madam" naturally
- You have a sharp sales instinct — always cross-sell and upsell tastefully
- You NEVER beg or act desperate. You're confident in your products
- During haggling, you're TOUGH but FAIR. You have a spine!

═══════════════════════════════════════
ABSOLUTE RULES (NEVER BREAK):
═══════════════════════════════════════
1. ONLY use products from the PRODUCT DATA below. NEVER invent products, prices, or stock.
2. NEVER reveal hiddenBottomPrice — that's your secret floor for negotiation.
3. You REQUEST actions via JSON — you don't execute them yourself.
4. If info is unavailable, say so clearly. Never hallucinate.
5. ALWAYS respond with VALID JSON — no exceptions, no markdown wrapping.

═══════════════════════════════════════
RESPONSE FORMAT (STRICT JSON):
═══════════════════════════════════════
{
  "message": "Your conversational response (can use emojis)",
  "products": ["product_id_1", "product_id_2"],
  "action": { "type": "ACTION_TYPE", "payload": { ... } }
}

RULES:
- "message" → REQUIRED, always present
- "products" → Array of product _id strings to show as cards. Use [] if none.
- "action" → Action object OR null if no action needed

═══════════════════════════════════════
AVAILABLE ACTIONS:
═══════════════════════════════════════
1. SHOW_PRODUCTS → Show specific products as cards
   { "type": "SHOW_PRODUCTS", "payload": { "productIds": ["id1","id2"] } }

2. ADD_TO_CART → Add product to cart (user shops through chat!)
   { "type": "ADD_TO_CART", "payload": { "productId": "...", "quantity": 1 } }

3. REMOVE_FROM_CART → Remove product from cart
   { "type": "REMOVE_FROM_CART", "payload": { "productId": "..." } }

4. CHECK_INVENTORY → Check stock/colors/sizes
   { "type": "CHECK_INVENTORY", "payload": { "productId": "..." } }

5. SORT_PRODUCTS → Sort the website product listing IN REAL TIME
   { "type": "SORT_PRODUCTS", "payload": { "sortBy": "price-low" } }
   Values: "price-low", "price-high", "rating", "newest"

6. FILTER_PRODUCTS → Filter the website product listing IN REAL TIME
   { "type": "FILTER_PRODUCTS", "payload": { "category": "...", "search": "...", "priceRange": [min, max] } }

7. APPLY_COUPON → Apply a negotiated discount (after haggling)
   { "type": "APPLY_COUPON", "payload": { "productId": "...", "discountPercent": 10, "reason": "birthday" } }

8. TRIGGER_CHECKOUT → Send user to checkout page
   { "type": "TRIGGER_CHECKOUT", "payload": {} }

═══════════════════════════════════════
🧠 CONTEXTUAL AWARENESS (CRITICAL):
═══════════════════════════════════════

PAGE CONTEXT — Where the user is right now:
${pageContext}

PRODUCTS RECENTLY SHOWN/DISCUSSED IN CHAT:
${conversationProductContext}

HOW TO USE CONTEXT:
- If user is on a PRODUCT PAGE → you already know what they're looking at. Reference it!
  Example: User on /product/P109 → "I see you're checking out the Blue Linen Blazer! Great taste, sir."
- If user says "this one", "it", "add it", "the second one", "that blue one" → use the CONVERSATION PRODUCTS above to figure out WHICH product they mean
- If user says "the first one" → it's the FIRST product in the most recently shown products list
- If user says "the second one" → it's the SECOND product
- If user says "that one" or "this" → it's usually the LAST product you showed or the one on the current page
- If user says "show me cheaper options" → SORT_PRODUCTS with price-low AND maybe show budget alternatives
- ALWAYS maintain conversational memory — if you showed shoes and they say "do you have it in blue", you know they mean the shoes

═══════════════════════════════════════
🛒 THE "NO MENU" RULE:
═══════════════════════════════════════
User MUST be able to complete the ENTIRE shopping journey through chat ONLY:
- "Summer is coming, I want something nice" → YOU analyze all products, pick relevant ones (summer clothes, sunglasses, etc.)
- "I like the second one" → YOU know which product that is from context → show details
- "Add it to my cart" → ADD_TO_CART with the right productId
- "Can I get a discount?" → Haggle with them
- "Okay checkout" → TRIGGER_CHECKOUT

ZERO button clicks needed. The chat IS the shop.

═══════════════════════════════════════
🔍 SMART PRODUCT DISCOVERY:
═══════════════════════════════════════
When user describes what they want (even vaguely), YOU must:
1. ANALYZE all products in your inventory
2. UNDERSTAND the intent: season, occasion, vibe, budget, style
3. PICK only relevant products — be smart about it:
   - "summer wedding in Italy" → light linens, sunglasses, elegant footwear (NOT winter coats!)
   - "summer is coming" → summer clothes, cool accessories, light fabrics
   - "something for my girlfriend" → gifts, jewelry, accessories, flowers
   - "I need shoes" → ALL shoe products
   - "going to a party" → party wear, trendy clothes
4. Show 3-5 BEST matching products with SHOW_PRODUCTS action
5. Describe WHY each product fits their need

═══════════════════════════════════════
🏷️ VIBE FILTER (UI CONTROL):
═══════════════════════════════════════
When user says things that imply sorting/filtering, UPDATE THE WEBSITE:
- "Show me cheaper options" → SORT_PRODUCTS price-low (website changes instantly!)
- "What's popular?" → SORT_PRODUCTS rating
- "Show me electronics" → FILTER_PRODUCTS category: electronics
- "Under $50" → FILTER_PRODUCTS priceRange: [0, 50]
ALWAYS tell the user you've updated the page so they know to look.

═══════════════════════════════════════
💰 SALES AGENT (PROACTIVE):
═══════════════════════════════════════
Don't just answer — SELL:
- After showing products: "This one's a bestseller, boss! ⭐"
- After adding to cart: "Great choice! You know what would look AMAZING with that? [cross-sell product]"
- Based on purchase history: "I see you bought [X] before — you might love [Y]!"
- If cart is building up: "You're getting quite the haul! Want me to see if I can get you a bundle deal?"
- If user seems undecided: "This one has 200+ 5-star reviews, sir. Just saying! 😏"

═══════════════════════════════════════
🤝 HAGGLE MODE (NEGOTIATION):
═══════════════════════════════════════
When user asks for discount, you become a NEGOTIATOR:

STEP 1 — EVALUATE:
• POLITE ("Can I get a small discount?"): 5-10%
• GOOD REASON ("It's my birthday" / "I'm a student" / "buying 2"): 10-15%
• BULK ORDER ("I want 3 of these"): 10-20%
• RUDE ("Give me 50% off NOW!"): REFUSE or RAISE price 5%!
  → "Bhai, with that attitude, price just went up 5%! 😄 Try asking nicely."
• LOWBALL ("90% off"): Refuse with personality
  → "Boss, I have a family to feed too! 😅 Best I can do is maybe 10%..."

STEP 2 — DON'T CAVE IMMEDIATELY:
- First ask: Push back gently, offer smaller discount
- Second ask: Show you're considering, offer slightly more
- Third ask with good reason: Give them the deal, make them feel they WON
- "Arre boss, you're killing me... fine, since it's your birthday 🎂"

STEP 3 — APPLY COUPON:
- Use APPLY_COUPON action with productId and discountPercent
- The server validates against hiddenBottomPrice (you never go below that)
- If server rejects → offer smaller discount

IMPORTANT: You can ONLY haggle if the user is talking about a SPECIFIC product. If they just say "give me a discount" without context, ask WHICH product they want a deal on.

═══════════════════════════════════════
📦 INVENTORY HANDLING:
═══════════════════════════════════════
- "Do you have this in blue?" → CHECK colors from product data
- "Is it available in size M?" → CHECK sizes from product data
- If NOT available → suggest closest alternative that IS in stock
- NEVER promise what you can't confirm from data

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
ALWAYS: Valid JSON. Be conversational. Have personality. BE THE SHOPKEEPER.`;
}

// ── Product Card Component ──────────────────────────────
interface ProductCardInChatProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onTryOn?: (product: Product) => void;
  tryOnAvailable?: boolean;
}

function ProductCardInChat({
  product,
  onAddToCart,
  onTryOn,
  tryOnAvailable,
}: ProductCardInChatProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border shadow-sm hover:shadow-md transition-all"
    >
      <Link to={`/product/${product._id}`} className="shrink-0">
        <img
          src={product.images?.[0] || product.imageUrl || "/placeholder.svg"}
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
            {onTryOn && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                onClick={() => onTryOn(product)}
                title={
                  tryOnAvailable ? "Virtual Try-On" : "Upload photo first (📸)"
                }
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            )}
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

  // Strategy 4: Extract message from incomplete JSON
  const incompleteMatch = raw.match(/"message"\s*:\s*"([^"]*)/i);
  if (incompleteMatch && incompleteMatch[1]) {
    return {
      message: incompleteMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"'),
    };
  }

  // Strategy 5: Plain text fallback
  return {
    message:
      raw.replace(/```[\s\S]*?```/g, "").trim() ||
      "I'm here to help! What would you like to browse?",
  };
}

// Strip any raw JSON from displayed message content
function cleanMessageContent(content: string): string {
  if (!content) return content;
  // Remove JSON code blocks
  let cleaned = content.replace(/```(?:json)?\s*\n?[\s\S]*?\n?```/g, "").trim();
  // If the entire content looks like JSON, try to extract just the message field
  if (cleaned.startsWith("{") && cleaned.includes('"message"')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.message) return parsed.message;
    } catch {
      // Try to extract message field with regex (works even for incomplete JSON)
      const msgMatch = cleaned.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (msgMatch)
        return msgMatch[1].replace(/\\n/g, "\n").replace(/\\"/g, '"');
      // If even that fails, check for incomplete message
      const incompleteMsgMatch = cleaned.match(/"message"\s*:\s*"([^"]*)/);
      if (incompleteMsgMatch && incompleteMsgMatch[1]) {
        return incompleteMsgMatch[1] + "...";
      }
    }
  }
  // Remove any trailing JSON objects that leaked into the message
  const jsonTailMatch = cleaned.match(
    /^([\s\S]+?)\s*\{[\s\S]*"(?:type|products|action|payload)"[\s\S]*\}\s*$/,
  );
  if (jsonTailMatch && jsonTailMatch[1].trim().length > 10) {
    cleaned = jsonTailMatch[1].trim();
  }
  return cleaned;
}

// ── Main AiClerk Component ──────────────────────────────
export function AiClerk() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Try-on state
  const [tryOnImage, setTryOnImage] = useState<string | null>(null); // base64 of user's photo
  const [tryOnLoading, setTryOnLoading] = useState(false);

  // Track user context fetched from backend
  const [userContext, setUserContext] = useState<any>(null);

  // Track products shown in conversation for contextual awareness
  const [lastShownProducts, setLastShownProducts] = useState<Product[]>([]);

  const {
    products,
    addToCart,
    removeFromCart,
    handleClerkAction,
    cart,
    setCartOpen,
  } = useStore();
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

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
    const contextProducts = allProducts.slice(0, 40).map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description?.substring(0, 150),
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

  // Build page context — what page is the user currently viewing?
  const buildPageContext = useCallback((): string => {
    const path = location.pathname;

    // On a specific product page: /product/:id
    const productMatch = path.match(/\/product\/(.+)/);
    if (productMatch) {
      const productId = productMatch[1];
      const product = products.find((p) => p._id === productId);
      if (product) {
        return `User is CURRENTLY VIEWING product page for: "${product.name}" (ID: ${product._id})
Price: $${product.price}${product.discountedPrice ? ` (discounted: $${product.discountedPrice})` : ""}
Category: ${product.category}
Rating: ${product.rating}/5 (${product.reviewCount} reviews)
Stock: ${product.stock > 0 ? `${product.stock} in stock` : "OUT OF STOCK"}
Colors: ${product.colors?.join(", ") || "N/A"}
Sizes: ${product.sizes?.join(", ") || "N/A"}
Tags: ${product.tags?.join(", ") || "N/A"}
→ If user says "this", "it", "this one", "add it" — they mean THIS product (${product._id}).`;
      }
      return `User is on a product page (ID: ${productId}) but product details not loaded.`;
    }

    if (path === "/" || path === "")
      return "User is on the HOME page — storefront.";
    if (path === "/shop")
      return "User is on the SHOP/BROWSE page — viewing all products.";
    if (path === "/checkout") return "User is on the CHECKOUT page.";
    if (path === "/wishlist") return "User is on their WISHLIST page.";
    if (path.startsWith("/profile")) return "User is on their PROFILE page.";
    if (path.startsWith("/orders")) return "User is viewing their ORDERS.";
    return `User is on page: ${path}`;
  }, [location.pathname, products]);

  // Build conversation product context — what products were recently shown/discussed?
  const buildConversationProductContext = useCallback((): string => {
    if (lastShownProducts.length === 0)
      return "No products shown yet in this conversation.";
    const lines = lastShownProducts.map(
      (p, i) =>
        `${i + 1}. "${p.name}" (ID: ${p._id}) — $${p.price}${p.discountedPrice ? ` (discounted: $${p.discountedPrice})` : ""} — ${p.stock > 0 ? "In Stock" : "OUT OF STOCK"} — Category: ${p.category}`,
    );
    return `Last shown products (in order):\n${lines.join("\n")}\n→ "the first one" = #1, "the second one" = #2, "that one" / "it" = most recently discussed or #1 if ambiguous.`;
  }, [lastShownProducts]);

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
    async (action: {
      type: string;
      payload?: any;
    }): Promise<{ extraMessage?: string; extraProducts?: Product[] }> => {
      const type = action.type?.toUpperCase?.() || action.type;
      const payload = action.payload || {};

      try {
        switch (type) {
          case "SHOW_PRODUCTS": {
            const ids =
              payload.productIds ||
              payload.ProductIDs ||
              payload.product_ids ||
              [];
            if (ids.length > 0) {
              handleClerkAction({ type: "show_products", payload: {} });
              const foundProducts = findProductsByIds(ids);
              if (foundProducts.length > 0) {
                setLastShownProducts(foundProducts);
              }
              return { extraProducts: foundProducts };
            }
            handleClerkAction({ type: "show_products", payload: {} });
            return {};
          }

          case "ADD_TO_CART": {
            const productId =
              payload.productId || payload.ProductID || payload.product_id;
            const quantity = payload.quantity || payload.Quantity || 1;
            let product = findProductById(productId);
            // If AI couldn't find the exact ID, try matching from lastShownProducts
            if (!product && lastShownProducts.length > 0) {
              // Check if the AI used a product name instead of ID
              if (typeof productId === "string" && productId.length < 20) {
                product = lastShownProducts.find((p) =>
                  p.name.toLowerCase().includes(productId.toLowerCase()),
                );
              }
              // Default to first shown product if no match
              if (!product) product = lastShownProducts[0];
            }
            // Also check the product page context
            if (!product) {
              const pageProductMatch =
                location.pathname.match(/\/product\/(.+)/);
              if (pageProductMatch) {
                product = findProductById(pageProductMatch[1]);
              }
            }
            if (product) {
              addToCart(product, quantity, payload.size, payload.color);
              // Track as recently discussed
              setLastShownProducts((prev) => {
                const filtered = prev.filter((p) => p._id !== product!._id);
                return [product!, ...filtered].slice(0, 10);
              });
              return {
                extraMessage: `✅ Added "${product.name}" (x${quantity}) to your cart!`,
              };
            }
            return {
              extraMessage:
                "⚠️ Couldn't find that product to add. Could you tell me which one you mean?",
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
            let productId =
              payload.productId || payload.ProductID || payload.product_id;
            // Resolve from context if not provided
            if (!productId && lastShownProducts.length > 0) {
              productId = lastShownProducts[0]._id;
            }
            if (!productId) {
              const pageMatch = location.pathname.match(/\/product\/(.+)/);
              if (pageMatch) productId = pageMatch[1];
            }
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
            let productId =
              payload.productId || payload.ProductID || payload.product_id;
            const discountPercent =
              payload.discountPercent ||
              payload.DiscountPercent ||
              payload.discount_percent ||
              payload.percentage ||
              10;
            const reason =
              payload.reason ||
              payload.CouponCode ||
              payload.coupon_code ||
              "negotiated";

            // Try to resolve productId from context if not provided
            if (!productId) {
              if (lastShownProducts.length > 0) {
                productId = lastShownProducts[0]._id;
              } else {
                const pageMatch = location.pathname.match(/\/product\/(.+)/);
                if (pageMatch) productId = pageMatch[1];
              }
            }

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
            // Use client-side navigation to preserve cart state
            navigate("/checkout");
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

    // ── Quick Try-On Detection ──────────────────────
    const tryOnMatch = currentInput
      .toLowerCase()
      .match(
        /try\s*(?:on|it|this)(?:\s+(?:the\s+)?(?:(\d+)(?:st|nd|rd|th)?|first|second|third|last)(?:\s+one)?)?/,
      );
    if (tryOnMatch && lastShownProducts.length > 0) {
      let idx = 0; // default to first
      const numStr = tryOnMatch[1];
      if (numStr) idx = parseInt(numStr) - 1;
      else if (currentInput.toLowerCase().includes("second")) idx = 1;
      else if (currentInput.toLowerCase().includes("third")) idx = 2;
      else if (currentInput.toLowerCase().includes("last"))
        idx = lastShownProducts.length - 1;

      if (idx >= 0 && idx < lastShownProducts.length) {
        handleVirtualTryOn(lastShownProducts[idx]);
        return;
      }
    }

    setIsLoading(true);

    try {
      // Build conversation history (last 12 messages for richer context)
      const conversationHistory = messages.slice(-12).map((m) => {
        let text = m.content;
        // Include product IDs that were shown in this message so AI remembers
        if (m.products && m.products.length > 0) {
          const productSummary = m.products
            .map((p, i) => `${i + 1}. "${p.name}" (ID: ${p._id}) - $${p.price}`)
            .join(", ");
          text += `\n[Products shown: ${productSummary}]`;
        }
        // Include action that was taken
        if (m.action) {
          text += `\n[Action executed: ${m.action.type}]`;
        }
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text }],
        };
      });

      // Build context
      const productCtx = buildProductContext();
      const userCtx = buildUserContext();
      const cartCtx = buildCartContext();
      const pageCtx = buildPageContext();
      const convProductCtx = buildConversationProductContext();
      const systemPrompt = buildSystemPrompt(
        productCtx,
        userCtx,
        cartCtx,
        pageCtx,
        convProductCtx,
      );

      // Call Gemini API with retry logic for rate limits
      const requestBody = JSON.stringify({
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
          maxOutputTokens: 2048,
        },
      });

      // Try each model in order — if one is rate-limited, try the next
      let responseText = "";
      let lastError = "";
      let succeeded = false;

      for (let modelIdx = 0; modelIdx < GEMINI_MODELS.length; modelIdx++) {
        const model = GEMINI_MODELS[modelIdx];
        const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

        for (let attempt = 0; attempt < MAX_RETRIES_PER_MODEL; attempt++) {
          try {
            console.log(`Trying model: ${model} (attempt ${attempt + 1})`);
            const response = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: requestBody,
            });

            if (response.ok) {
              const data = await response.json();
              responseText =
                data.candidates?.[0]?.content?.parts?.[0]?.text || "";

              // Check for MAX_TOKENS finish reason
              const finishReason = data.candidates?.[0]?.finishReason;
              if (finishReason === "MAX_TOKENS") {
                console.warn(`⚠️ Response truncated due to MAX_TOKENS`);
                // Try to extract whatever valid content we have
                if (responseText) {
                  // If incomplete JSON, try to fix it
                  if (
                    responseText.trim().startsWith("{") &&
                    !responseText.trim().endsWith("}")
                  ) {
                    // Close the JSON properly
                    responseText = responseText.trim();
                    // Count open/close braces
                    const openBraces = (responseText.match(/\{/g) || []).length;
                    const closeBraces = (responseText.match(/\}/g) || [])
                      .length;
                    const missing = openBraces - closeBraces;
                    if (missing > 0) {
                      // Close any open strings first
                      if (responseText.match(/"[^"]*$/)) {
                        responseText += '"';
                      }
                      // Add missing braces
                      responseText += "}".repeat(missing);
                    }
                  }
                }
              }
              succeeded = true;
              console.log(`✅ Success with model: ${model}`);
              break;
            }

            if (response.status === 429) {
              console.warn(
                `⚠️ Model ${model} rate limited (429). Trying next model...`,
              );
              // Update loading message
              setMessages((prev) => {
                const updated = [...prev];
                const loadingIdx = updated.findIndex(
                  (m) => m.id === "loading-indicator",
                );
                if (loadingIdx !== -1) {
                  updated[loadingIdx] = {
                    ...updated[loadingIdx],
                    content: `Ek second boss, switching to backup AI... ⏳`,
                  };
                }
                return updated;
              });
              lastError = "QUOTA_EXHAUSTED";
              // Small delay before trying next model
              await new Promise((r) => setTimeout(r, RETRY_DELAY));
              break; // break retry loop, continue to next model
            }

            // Non-429 error
            const errData = await response.json().catch(() => ({}));
            console.error(
              `Gemini API error (${model}):`,
              response.status,
              errData,
            );
            lastError = `Gemini API error: ${response.status}`;
            break; // try next model
          } catch (fetchErr) {
            console.error(`Network error with model ${model}:`, fetchErr);
            lastError = "Network error";
            break; // try next model
          }
        }

        if (succeeded) break;
      }

      if (!succeeded) {
        throw new Error(lastError || "QUOTA_EXHAUSTED");
      }

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

      // Build final message — clean any raw JSON that leaked
      let finalMessage = cleanMessageContent(parsed.message);
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

      // Track shown products for conversational context
      if (displayProducts && displayProducts.length > 0) {
        setLastShownProducts(displayProducts);
      }
    } catch (error) {
      console.error("Clerk error:", error);

      // ── Smart Fallback ──────────────────────────────
      let fallbackMessage =
        "Arre yaar, my connection is acting up! 😅 Let me try to help you anyway...";

      // Handle quota exhaustion specifically
      if (error instanceof Error && error.message === "QUOTA_EXHAUSTED") {
        fallbackMessage =
          "Boss, bahut zyada rush ho gaya aaj! 😅 AI quota limit hit — but don't worry, I can still help with basic stuff. Try again in a minute or two!";
      }

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
    // Track this product as the "currently discussed" product
    setLastShownProducts((prev) => {
      // Put the clicked product at position 0 (most recently discussed)
      const filtered = prev.filter((p) => p._id !== product._id);
      return [product, ...filtered].slice(0, 10);
    });
    const addMessage: ClerkMessage = {
      id: generateId(),
      role: "assistant",
      content: `Great choice, boss! 🛍️ Added "${product.name}" to your cart. ${
        cart.items.length === 0
          ? "That's your first item — great start!"
          : `You now have ${cart.items.length + 1} items in your cart.`
      } Want to keep shopping, haggle for a discount, or head to checkout?`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, addMessage]);
  };

  // ── Image Upload for Virtual Try-On ──────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content:
            "Boss, that doesn't look like an image! Please upload a photo (JPG, PNG). 📸",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    // Max 4MB
    if (file.size > 4 * 1024 * 1024) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content:
            "That image is too large, boss! Please use a photo under 4MB. 📏",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setTryOnImage(base64);

      // Show the uploaded image in chat
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "user",
          content: "Here's my photo for virtual try-on! 📸",
          timestamp: new Date(),
          userImage: base64,
        },
      ]);

      // Prompt user to pick a product
      const tryOnMsg: ClerkMessage = {
        id: generateId(),
        role: "assistant",
        content:
          lastShownProducts.length > 0
            ? `Nice photo, boss! 📸 Now tell me which product you want to try on, or say "try on the first one" and I'll generate a virtual try-on image for you! 🎨`
            : `Looking good, boss! 📸 Now browse some products or tell me what you'd like to try on, and I'll create a virtual try-on image for you! Search for something like "show me jackets" first. 🎨`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, tryOnMsg]);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (e.target) e.target.value = "";
  };

  // Helper: Convert an HTMLImageElement to base64 data URL
  const imgElementToBase64 = (img: HTMLImageElement): string => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width || 1024;
    canvas.height = img.naturalHeight || img.height || 1024;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const handleVirtualTryOn = async (product: Product) => {
    if (!tryOnImage) {
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content:
            "Upload your photo first, boss! Click the 📸 camera button to upload your picture, then I'll show you how you'd look wearing this! 🎨",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    setTryOnLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        id: generateId(),
        role: "assistant",
        content: `Creating a virtual try-on of "${product.name}" for you... This may take a moment! 🎨✨`,
        timestamp: new Date(),
      },
    ]);

    try {
      const base64Data = tryOnImage.split(",")[1];
      const mimeType = tryOnImage.match(/data:(.*?);/)?.[1] || "image/jpeg";

      console.log("[TryOn] Starting virtual try-on for:", product.name);
      console.log(
        "[TryOn] Image mimeType:",
        mimeType,
        "base64 length:",
        base64Data?.length,
      );

      // ─── Step 1: Analyze user photo with Gemini (text model) ───
      let userDescription = "a person";
      console.log("[TryOn] Step 1: Analyzing user photo with Gemini...");

      const analyzePrompt = `Look at this photo and describe the person in it for a fashion visualization. Be concise (2-3 sentences max). Include:
- Gender (man/woman/person), approximate age range
- Skin tone, hair color/style
- Build (slim, athletic, average, etc.)
- Current pose/expression
Do NOT mention clothing they're wearing. Output ONLY the description, no JSON, no labels.`;

      for (const model of GEMINI_MODELS) {
        try {
          const analyzeUrl = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const analyzeResponse = await fetch(analyzeUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: analyzePrompt },
                    { inlineData: { mimeType, data: base64Data } },
                  ],
                },
              ],
              generationConfig: { temperature: 0.3, maxOutputTokens: 200 },
            }),
          });

          if (analyzeResponse.ok) {
            const analyzeData = await analyzeResponse.json();
            const desc =
              analyzeData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            if (desc.length > 20) {
              userDescription = desc.trim();
              console.log("[TryOn] User description:", userDescription);
              break;
            }
          }
          console.warn(`[TryOn] ${model} analyze failed, trying next...`);
        } catch (e) {
          console.warn(`[TryOn] ${model} analyze error:`, e);
        }
      }

      // ─── Step 2: Generate try-on image using Puter.js (FREE!) ───
      console.log("[TryOn] Step 2: Generating try-on image with Puter.js...");

      const tryOnPrompt = `Photorealistic fashion photography of ${userDescription} wearing ${product.name}. ${product.description || ""}. The ${product.category || "clothing"} is ${product.colors?.join(" and ") || "as described"} colored. The person is posing naturally in a clean studio setting with soft professional lighting. Full body shot, fashion catalog style. The clothing fits perfectly and looks natural. High quality, detailed, 4K resolution.`;

      console.log(
        "[TryOn] Image gen prompt:",
        tryOnPrompt.slice(0, 200) + "...",
      );

      let generatedImage: string | null = null;

      // Check if Puter.js is loaded
      if (typeof puter !== "undefined" && puter?.ai?.txt2img) {
        for (const puterModel of PUTER_IMAGE_MODELS) {
          console.log(`[TryOn] Trying Puter model: ${puterModel}`);
          try {
            const imgElement = await puter.ai.txt2img(tryOnPrompt, {
              model: puterModel,
              quality: "low",
            });
            console.log(
              `[TryOn] Puter ${puterModel} returned:`,
              typeof imgElement,
              imgElement?.tagName,
            );

            if (imgElement && imgElement instanceof HTMLImageElement) {
              // Wait for image to load if needed
              if (!imgElement.complete) {
                await new Promise<void>((resolve, reject) => {
                  imgElement.onload = () => resolve();
                  imgElement.onerror = () =>
                    reject(new Error("Image load failed"));
                  setTimeout(() => resolve(), 15000); // 15s timeout
                });
              }
              generatedImage = imgElementToBase64(imgElement);
              console.log(
                `[TryOn] SUCCESS with Puter ${puterModel}! Base64 length: ${generatedImage.length}`,
              );
              break;
            }
          } catch (puterErr) {
            console.warn(`[TryOn] Puter ${puterModel} failed:`, puterErr);
            continue;
          }
        }
      } else {
        console.warn(
          "[TryOn] Puter.js not loaded! Falling back to text description.",
        );
      }

      // ─── Step 3: Show result ───
      if (generatedImage) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateId(),
            role: "assistant",
            content: `Here's how you'd look in "${product.name}", boss! 🎨🔥\n\n_This is an AI-generated visualization based on your photo description._ Looking sharp! Want me to add it to your cart?`,
            timestamp: new Date(),
            image: generatedImage,
            userImage: tryOnImage, // show original photo side by side
          },
        ]);
        return;
      }

      // ─── Fallback: Text-based AI Styling Report ───
      console.log(
        "[TryOn] No image gen available, using AI styling analysis...",
      );

      const stylingPrompt = `You are a fun, enthusiastic desi shopkeeper with amazing fashion sense. I'm showing you MY PHOTO and I want to virtually try on a product.

PRODUCT:
- Name: ${product.name}
- Category: ${product.category || "Fashion"}
- Description: ${product.description || "A stylish product"}
- Colors: ${product.colors?.join(", ") || "as shown"}
- Price: $${product.price}

Look at MY PHOTO carefully and give me a PERSONALIZED virtual styling report:

1. 👤 PHOTO ANALYSIS: Briefly note my skin tone, build, and current style (2-3 lines)
2. 👕 HOW IT WOULD LOOK: Describe vividly how this specific product would look ON ME — the fit, the drape, how the color complements my complexion
3. 🔥 STYLE RATING: Rate the match out of 10 with a fun reason
4. 💡 STYLING TIPS: 2-3 specific tips on what to pair this with (jeans, accessories, shoes etc.)
5. 🎯 VERDICT: One punchy line — would you recommend this for me?

Be specific to MY appearance from the photo! Use emojis, be enthusiastic, and talk like a cool desi shopkeeper ("boss", "bhai", "yaar"). Keep it under 300 words. DO NOT output any JSON.`;

      for (const model of GEMINI_MODELS) {
        const fallbackUrl = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
        console.log(`[TryOn] Styling analysis with model: ${model}`);

        try {
          const descResponse = await fetch(fallbackUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: stylingPrompt },
                    { inlineData: { mimeType, data: base64Data } },
                  ],
                },
              ],
              generationConfig: { temperature: 0.9, maxOutputTokens: 1024 },
            }),
          });

          console.log(
            `[TryOn] ${model} styling status: ${descResponse.status}`,
          );

          if (descResponse.ok) {
            const descData = await descResponse.json();
            const descText =
              descData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            console.log(
              `[TryOn] Got styling report (${descText.length} chars)`,
            );

            if (descText.length > 50) {
              setMessages((prev) => [
                ...prev,
                {
                  id: generateId(),
                  role: "assistant",
                  content:
                    `📸 **Virtual Styling Report — "${product.name}"**\n\n` +
                    cleanMessageContent(descText) +
                    `\n\n🛒 _Want me to add it to your cart?_`,
                  timestamp: new Date(),
                  userImage: tryOnImage,
                },
              ]);
              return;
            }
          }
          console.warn(`[TryOn] ${model} styling failed, trying next...`);
        } catch (descErr) {
          console.warn(`[TryOn] ${model} styling error:`, descErr);
          continue;
        }
      }

      // All models failed
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: `Boss, the styling service is busy right now! 😅 But "${product.name}" is a 🔥 pick — you've got great taste. Want me to add it to your cart? 🛒`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("[TryOn] Fatal error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: `Oops, the virtual try-on hit a snag! 😅 Error: ${err instanceof Error ? err.message : "Unknown"}. But trust me boss, "${product.name}" would look amazing on you. Want me to add it to your cart instead? 🛒`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setTryOnLoading(false);
    }
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
              "fixed z-50 bg-white dark:bg-gray-900 shadow-2xl border overflow-hidden flex flex-col transition-all duration-300",
              isMinimized
                ? "bottom-6 right-6 w-80 h-16 rounded-2xl"
                : isMaximized
                  ? "inset-0 w-full h-full rounded-none"
                  : "bottom-6 right-6 w-[95vw] sm:w-[420px] h-[80vh] sm:h-[600px] max-h-[calc(100vh-48px)] rounded-2xl",
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
                  onClick={() => {
                    if (isMinimized) setIsMinimized(false);
                    else setIsMinimized(true);
                    setIsMaximized(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={isMinimized ? "Restore" : "Minimize"}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsMaximized(!isMaximized);
                    setIsMinimized(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  {isMaximized ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setIsMaximized(false);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Close"
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
                        {/* User uploaded image */}
                        {message.userImage && (
                          <div className="rounded-xl overflow-hidden border shadow-sm max-w-[200px]">
                            <img
                              src={message.userImage}
                              alt="Your photo"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        )}

                        <div
                          className={cn(
                            "px-4 py-3 rounded-2xl text-sm whitespace-pre-line",
                            message.role === "user"
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-white dark:bg-gray-800 shadow-sm rounded-bl-md",
                          )}
                        >
                          {cleanMessageContent(message.content)}
                        </div>

                        {/* AI-generated image (try-on result) */}
                        {message.image && (
                          <div className="rounded-xl overflow-hidden border-2 border-indigo-200 shadow-lg">
                            <img
                              src={message.image}
                              alt="Virtual try-on result"
                              className="w-full h-auto object-cover"
                            />
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 px-3 py-2 text-xs text-center text-muted-foreground">
                              ✨ AI Virtual Try-On — For visualization only
                            </div>
                          </div>
                        )}

                        {/* Product Cards — Rich Results */}
                        {message.products && message.products.length > 0 && (
                          <div className="space-y-2 w-full">
                            {message.products.map((product) => (
                              <ProductCardInChat
                                key={product._id}
                                product={product}
                                onAddToCart={handleAddToCartFromChat}
                                onTryOn={handleVirtualTryOn}
                                tryOnAvailable={!!tryOnImage}
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

                {/* Try-on photo indicator */}
                {tryOnImage && (
                  <div className="px-4 py-1.5 border-t bg-purple-50 dark:bg-purple-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                      <Camera className="w-3 h-3" />
                      <span>Try-on photo uploaded</span>
                      <img
                        src={tryOnImage}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover border"
                      />
                    </div>
                    <button
                      onClick={() => setTryOnImage(null)}
                      className="text-xs text-purple-500 hover:text-purple-700"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {tryOnLoading && (
                  <div className="px-4 py-2 border-t bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Generating virtual try-on...</span>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-900">
                  {/* Hidden file input for image upload */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <form
                    data-clerk-form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "shrink-0 p-2 rounded-lg transition-colors",
                        tryOnImage
                          ? "text-purple-600 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30"
                          : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800",
                      )}
                      title="Upload photo for virtual try-on"
                      disabled={isLoading || tryOnLoading}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        tryOnImage
                          ? "Say 'try on the first one'..."
                          : "Ask me anything — find, haggle, try-on..."
                      }
                      className="flex-1"
                      disabled={isLoading || tryOnLoading}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!input.trim() || isLoading || tryOnLoading}
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
