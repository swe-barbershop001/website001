import { useState } from "react";
import { Button, Input, Textarea } from "@material-tailwind/react";
import { useAuth } from "../context/AuthContext";
import { API_ENDPOINTS, POSTS_BASE_URL } from "../data/api";
import { getAuthToken } from "../utils/api";
import toast from "react-hot-toast";

function BroadcastPost() {
  const { isAuthenticated, isAdmin, isSuperAdmin } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    image: null,
    image_url: "",
  });
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Clear image_url if user uploads a file
      setFormData({
        ...formData,
        image: file,
        image_url: "",
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
    if (error) setError("");
  };

  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setFormData({
      ...formData,
      image_url: url,
      image: null, // Clear file if user provides URL
    });
    setPreview(null);
    if (error) setError("");
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image: null,
      image_url: "",
    });
    setPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.description.trim()) {
      setError("Tavsif talab qilinadi");
      toast.error("Tavsif talab qilinadi");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Autentifikatsiya talab qilinadi");
      }

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      
      if (formData.title.trim()) {
        formDataToSend.append("title", formData.title.trim());
      }
      
      formDataToSend.append("description", formData.description.trim());
      
      if (formData.image) {
        formDataToSend.append("image", formData.image);
      } else if (formData.image_url.trim()) {
        formDataToSend.append("image_url", formData.image_url.trim());
      }

      const response = await fetch(`${POSTS_BASE_URL}${API_ENDPOINTS.broadcastPost}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type header - browser will set it with boundary for FormData
        },
        body: formDataToSend,
        mode: "cors",
      });

      const data = await response.json();

      if (response.ok || response.status === 200) {
        setSuccess("Post muvaffaqiyatli yuborildi!");
        
        // Show success message with stats if available
        const message = data.totalClients !== undefined
          ? `Post muvaffaqiyatli yuborildi!\nJami clientlar: ${data.totalClients}\nYuborilgan: ${data.sentCount}\nXato: ${data.failedCount}`
          : "Post muvaffaqiyatli yuborildi!";
        
        toast.success(message, {
          duration: 5000,
          style: {
            background: '#10b981',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            whiteSpace: 'pre-line',
          },
        });

        // Reset form
        setFormData({
          title: "",
          description: "",
          image: null,
          image_url: "",
        });
        setPreview(null);
        
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const errorMsg = data.message || data.error || "Post yuborish muvaffaqiyatsiz";
        setError(errorMsg);
        toast.error(errorMsg, {
          duration: 4000,
        });
      }
    } catch (err) {
      console.error("Error sending broadcast post:", err);
      const errorMsg = err.message || "Tarmoq xatosi. Iltimos, qayta urinib ko'ring.";
      setError(errorMsg);
      toast.error(errorMsg, {
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated() || (!isAdmin() && !isSuperAdmin())) {
    return (
      <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-black text-xl">Bu sahifa faqat admin yoki super admin uchun</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 sm:pt-20 md:pt-[92px] min-h-screen bg-gray-50">
      <section className="w-full py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black mb-2">
              Telegram Botga Post Yuborish
            </h1>
            <p className="text-gray-600">
              Botga start bosgan barcha clientlarga post yuborish
            </p>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
              ✅ {success}
            </div>
          )}

          {/* Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Post sarlavhasi (ixtiyoriy)
                </label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Post sarlavhasini kiriting"
                  size="lg"
                  className="!text-black dark:!text-white !bg-white dark:!bg-gray-700"
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Post tavsifi <span className="text-red-500">*</span>
                </label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Post tavsifini kiriting"
                  rows={6}
                  required
                  size="lg"
                  className="!text-black dark:!text-white !bg-white dark:!bg-gray-700 min-h-[150px]"
                  disabled={isSubmitting}
                />
              </div>

              {/* Image Upload or URL */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Post rasmi (yuklash yoki URL)
                  </label>
                  
                  {/* Image URL Input */}
                  <Input
                    type="url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={handleImageUrlChange}
                    placeholder="Rasm URL manzilini kiriting (ixtiyoriy)"
                    size="lg"
                    className="!text-black !bg-white mb-3"
                    disabled={isSubmitting || !!formData.image}
                  />

                  {/* File Upload */}
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      disabled={isSubmitting || !!formData.image_url}
                    />
                    <label
                      htmlFor="image-upload"
                      className={`flex-1 px-4 py-3 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${
                        isSubmitting || formData.image_url
                          ? "border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          : "border-gray-300 dark:border-gray-600 hover:border-barber-olive hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}>
                      {formData.image
                        ? formData.image.name
                        : "Rasm yuklash (ixtiyoriy)"}
                    </label>
                    {(formData.image || formData.image_url) && (
                      <Button
                        type="button"
                        onClick={handleRemoveImage}
                        size="sm"
                        variant="outlined"
                        className="border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                        disabled={isSubmitting}>
                        O'chirish
                      </Button>
                    )}
                  </div>

                  {/* Image Preview */}
                  {preview && (
                    <div className="mt-4">
                      <img
                        src={preview}
                        alt="Preview"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                    </div>
                  )}

                  {formData.image_url && !preview && (
                    <div className="mt-4">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="max-w-full h-auto max-h-64 rounded-lg border border-gray-300 dark:border-gray-600"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isSubmitting || !formData.description.trim()}
                  size="lg"
                  className="bg-barber-olive hover:bg-barber-gold text-white font-semibold"
                  loading={isSubmitting}>
                  {isSubmitting ? "Yuborilmoqda..." : "Post Yuborish"}
                </Button>
              </div>
            </form>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-600 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Eslatma:</strong> Post barcha clientlarga yuboriladi. Tavsif majburiy, sarlavha va rasm ixtiyoriy.
              Rasm yuklash yoki URL berish mumkin.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default BroadcastPost;

