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
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Rating } from "@/components/ui/Rating";
import { useStore } from "@/context/StoreContext";
import { formatCurrency, generateId } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Product, ClerkMessage, ClerkAction } from "@/types/store";
import { Link } from "react-router-dom";

const GEMINI_API_KEY = "***REDACTED_GOOGLE_API_KEY_2***";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// System prompt for the AI Clerk
const CLERK_SYSTEM_PROMPT = `You are a friendly, helpful AI shopping assistant (Clerk) for an e-commerce store. Your personality is warm, conversational, and knowledgeable about products.

Your capabilities:
1. Help users find products by category, price, features
2. Recommend products based on user preferences
3. Add items to cart when requested
4. Apply discounts through "haggle mode" - users can negotiate prices
5. Guide users through the shopping experience

IMPORTANT: You must respond with JSON in this format when you need to trigger an action:
{
  "message": "Your friendly response text here",
  "action": {
    "type": "action_type",
    "payload": { relevant data }
  },
  "products": [] // Optional: array of product recommendations
}

Available action types:
- "show_products" - Show all products
- "filter_products" - Filter by category/search/price with payload: { category?, search?, priceRange?: [min, max] }
- "sort_products" - Sort products with payload: { sortBy: "price-low"|"price-high"|"rating"|"newest" }
- "add_to_cart" - Add product with payload: { productId, quantity }
- "apply_discount" - Apply discount with payload: { code, percentage }
- "navigate" - Navigate to page with payload: { path }

For regular conversation without actions, just respond with:
{
  "message": "Your response here"
}

Haggle Mode Rules:
- If user asks for discount politely, offer 5-15% off
- If user gives a good reason (student, bulk order, first time), offer 10-20% off
- If user is rude or demanding, politely decline or only offer 5%
- Be playful and engaging during negotiations
- Generate a discount code like "FRIENDLY10" based on the discount

When recommending products, describe them enthusiastically but naturally.
Keep responses concise and helpful.`;

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
      <img
        src={product.imageUrl}
        alt={product.name}
        className="w-20 h-20 object-cover rounded-lg"
      />
      <div className="flex-1 min-w-0">
        <Link
          to={`/product/${product._id}`}
          className="font-medium text-sm hover:text-primary transition-colors line-clamp-1"
        >
          {product.name}
        </Link>
        <Rating value={product.rating} size="sm" className="mt-1" />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">
              {formatCurrency(product.discountedPrice || product.price, product.currency)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-xs text-muted-foreground line-through">
                {formatCurrency(product.originalPrice, product.currency)}
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2"
            onClick={() => onAddToCart(product)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function AiClerk() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ClerkMessage[]>([
    {
      id: generateId(),
      role: "assistant",
      content: "Hi there! 👋 I'm your personal shopping assistant. I can help you find products, add items to your cart, and even negotiate special discounts for you! What are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { products, addToCart, handleClerkAction, cart, setCartOpen } = useStore();

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

  const parseClerkResponse = useCallback((responseText: string): { message: string; action?: ClerkAction; products?: Product[] } => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(responseText);
      return {
        message: parsed.message || responseText,
        action: parsed.action,
        products: parsed.products,
      };
    } catch {
      // If not JSON, return as plain message
      return { message: responseText };
    }
  }, []);

  const findProductsByQuery = useCallback((query: string): Product[] => {
    const searchLower = query.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.tags?.some((t) => t.toLowerCase().includes(searchLower))
    ).slice(0, 4);
  }, [products]);

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
      // Build conversation context
      const conversationHistory = messages.slice(-6).map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));

      // Add product context
      const productContext = `\n\nAvailable products (sample): ${JSON.stringify(
        products.slice(0, 10).map((p) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          price: p.price,
          rating: p.rating,
        }))
      )}`;

      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: CLERK_SYSTEM_PROMPT + productContext }] },
            { role: "model", parts: [{ text: '{"message": "I understand. I\'m ready to help customers shop!"}' }] },
            ...conversationHistory,
            { role: "user", parts: [{ text: currentInput }] },
          ],
        }),
      });

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      
      const { message, action, products: recommendedProducts } = parseClerkResponse(responseText);

      // Find relevant products based on the conversation
      let displayProducts = recommendedProducts;
      if (!displayProducts && (
        currentInput.toLowerCase().includes("show") ||
        currentInput.toLowerCase().includes("find") ||
        currentInput.toLowerCase().includes("looking for") ||
        currentInput.toLowerCase().includes("recommend")
      )) {
        displayProducts = findProductsByQuery(currentInput);
      }

      const assistantMessage: ClerkMessage = {
        id: generateId(),
        role: "assistant",
        content: message,
        timestamp: new Date(),
        products: displayProducts,
        action,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Execute action if present
      if (action) {
        handleClerkAction(action);
      }
    } catch (error) {
      console.error("Clerk error:", error);
      
      // Fallback response with smart detection
      let fallbackMessage = "I'm having a bit of trouble connecting right now. Let me try to help anyway!";
      let fallbackProducts: Product[] | undefined;

      const inputLower = currentInput.toLowerCase();
      
      if (inputLower.includes("show") || inputLower.includes("find") || inputLower.includes("looking")) {
        fallbackProducts = findProductsByQuery(currentInput);
        if (fallbackProducts.length > 0) {
          fallbackMessage = `Here are some products you might like! Click on any to learn more, or I can add them to your cart.`;
        } else {
          fallbackMessage = "I couldn't find exact matches, but let me show you our popular items!";
          fallbackProducts = products.slice(0, 4);
        }
      } else if (inputLower.includes("discount") || inputLower.includes("deal") || inputLower.includes("cheaper")) {
        fallbackMessage = "I love helping customers save! Use code WELCOME10 for 10% off your order. 🎉";
        handleClerkAction({ type: "apply_discount", payload: { code: "WELCOME10", percentage: 10 } });
      } else if (inputLower.includes("cart")) {
        fallbackMessage = `Your cart has ${cart.items.length} items. Would you like to proceed to checkout?`;
        setCartOpen(true);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: fallbackMessage,
          timestamp: new Date(),
          products: fallbackProducts,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    setInput(action);
    setTimeout(() => sendMessage(), 100);
  };

  const handleAddToCartFromChat = (product: Product) => {
    addToCart(product, 1);
    const addMessage: ClerkMessage = {
      id: generateId(),
      role: "assistant",
      content: `Great choice! I've added "${product.name}" to your cart. ${cart.items.length === 0 ? "That's your first item!" : `You now have ${cart.items.length + 1} items.`} Would you like to continue shopping or checkout?`,
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
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-primary to-blue-600 text-white rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 transition-shadow"
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
                : "bottom-6 right-6 w-[95vw] sm:w-[420px] h-[80vh] sm:h-[600px] max-h-[calc(100vh-48px)]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary to-blue-600 text-white">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Shopping Clerk</h3>
                  <p className="text-xs text-white/80">Always here to help</p>
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
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] space-y-3",
                          message.role === "user" ? "items-end" : "items-start"
                        )}
                      >
                        <div
                          className={cn(
                            "px-4 py-3 rounded-2xl text-sm",
                            message.role === "user"
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-white dark:bg-gray-800 shadow-sm rounded-bl-md"
                          )}
                        >
                          {message.content}
                        </div>
                        
                        {/* Product Cards */}
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
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl rounded-bl-md shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
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
                      onClick={() => handleQuickAction("Show me your best products")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <Search className="w-3 h-3" />
                      Browse Products
                    </button>
                    <button
                      onClick={() => handleQuickAction("I'm looking for a good discount")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <Tag className="w-3 h-3" />
                      Get Discount
                    </button>
                    <button
                      onClick={() => handleQuickAction("Show me what's in my cart")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors whitespace-nowrap"
                    >
                      <ShoppingCart className="w-3 h-3" />
                      My Cart
                    </button>
                  </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-900">
                  <form
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
                      placeholder="Ask me anything about our products..."
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
