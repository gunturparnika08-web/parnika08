export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { image_url, speech_text, language } = req.body || {};

  // Validate inputs
  if (!image_url && !speech_text) {
    return res.status(400).json({ error: "Please provide image_url or speech_text" });
  }

  // Mock AI response based on language
  const mockResponses = {
    te: {
      name: "హస్తకళ బాంబూ బాస్కెట్",
      description: "సాంప్రదాయ శైలి బాంబూ బాస్కెట్, నిండా చేతితో తయారు చేయబడింది",
    },
    hi: {
      name: "हस्तनिर्मित बांस की टोकरी",
      description: "पारंपरिक शैली में बनी बांस की टोकरी, पूरी तरह हाथ से बनाई गई",
    },
    ta: {
      name: "கையால் செய்யப்பட்ட மூங்கில் கூடை",
      description: "பாரம்பரிய பாணியில் செய்யப்பட்ட மூங்கில் கூடை, கை நூல் பல்நூற்பு",
    },
    kn: {
      name: "ಕೈಯಿಂದ ಮಾಡಿದ ಬಿದಿರು ಟೋಕರಿ",
      description: "ಸಾಂಪ್ರದಾಯಿಕ ಶೈಲಿಯಲ್ಲಿ ನಿರ್ಮಿತ ಬಿದಿರು ಟೋಕರಿ",
    },
    bn: {
      name: "হস্তনির্মিত বাঁশের ঝুড়ি",
      description: "ঐতিহ্যবাহী শৈলীতে তৈরি বাঁশের ঝুড়ি, সম্পূর্ণ হাতে তৈরি",
    },
    en: {
      name: "Handmade Bamboo Basket",
      description: "Handcrafted bamboo basket made using traditional techniques.",
    },
  };

  const langResponse = mockResponses[language] || mockResponses.en;

  res.status(200).json({
    product: {
      name: {
        text: langResponse.name,
        lang: language,
        confidence: 0.92,
      },
      name_en: {
        text: mockResponses.en.name,
        confidence: 0.89,
      },
      description: {
        text: langResponse.description,
        lang: language,
        confidence: 0.90,
      },
      description_en: {
        text: mockResponses.en.description,
        confidence: 0.88,
      },
      price: {
        amount: 500,
        currency: "INR",
        confidence: 0.95,
      },
      category: {
        id: "home_decor",
        label_en: "Home decor",
        confidence: 0.78,
      },
      tags: ["handmade", "bamboo", "basket", "traditional"],
      quantity: {
        available: 10,
        confidence: 0.6,
      },
      photos: image_url ? [image_url] : [],
    },
    low_confidence_fields: ["category", "quantity"],
    ai_log_id: `ai_${Date.now()}`,
  });
}
