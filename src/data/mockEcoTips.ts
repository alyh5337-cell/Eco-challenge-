export interface EcoTip {
  id: string;
  category: 'energy' | 'water' | 'waste' | 'nature' | 'climate' | 'lifestyle';
  categoryLabel_en: string;
  categoryLabel_ar: string;
  fact_en: string;
  fact_ar: string;
  action_en: string;
  action_ar: string;
  icon: string;
}

export const ECO_TIPS_DATABASE: EcoTip[] = [
  {
    id: 'tip-1',
    category: 'waste',
    categoryLabel_en: 'Plastic & Ocean',
    categoryLabel_ar: 'البلاستيك والمحيطات',
    fact_en: 'A standard plastic water bottle takes over 450 years to decompose in nature, fragmenting into microplastics that harm marine wildlife.',
    fact_ar: 'تستغرق قارورة الماء البلاستيكية أكثر من 450 عاماً لتتحلل في الطبيعة، وتتفتت إلى جزيئات بلاستيكية دقيقة تضر الكائنات البحرية.',
    action_en: 'Switching to a stainless steel reusable bottle prevents up to 156 single-use plastic bottles per person each year.',
    action_ar: 'استخدام قارورة معدنية قابلة لإعادة الاستخدام يوفر ما يصل إلى 156 قارورة بلاستيكية لكل شخص سنوياً.',
    icon: '🌊',
  },
  {
    id: 'tip-2',
    category: 'energy',
    categoryLabel_en: 'Vampire Power',
    categoryLabel_ar: 'طاقة الشبح (المستهلكة بالخفاء)',
    fact_en: 'Electronics left plugged in on standby consume up to 10% of an average household’s total electricity bill without doing any work.',
    fact_ar: 'الأجهزة الإلكترونية الموصولة بالكهرباء في وضع الاستعداد تستهلك ما يصل إلى 10% من إجمالي فاتورة الكهرباء المنزلية دون أي فائدة.',
    action_en: 'Use smart power strips with an on/off switch to eliminate phantom power draw from TVs, chargers, and game consoles.',
    action_ar: 'استخدم مشترك كهربائي بمفتاح إيقاف لفصل أجهزة التلفاز والشواحن وأجهزة الألعاب عند عدم الاستخدام.',
    icon: '⚡',
  },
  {
    id: 'tip-3',
    category: 'nature',
    categoryLabel_en: 'Forest Superpowers',
    categoryLabel_ar: 'قوى الغابات الخارقة',
    fact_en: 'One mature leafy tree can absorb over 48 pounds (22 kg) of carbon dioxide each year and release enough oxygen for two people to breathe.',
    fact_ar: 'شجرة واحدة مكتملة النمو يمكنها امتصاص أكثر من 22 كجم من ثاني أكسيد الكربون سنوياً وتوفير أكسجين يكفي لشخصين.',
    action_en: 'Planting urban trees on the sunny sides of buildings also reduces summer air conditioning needs by up to 30%.',
    action_ar: 'زراعة الأشجار بجانب المباني المشمسة تخفض الحاجة لتشغيل مكيفات الهواء صيفاً بنسبة تصل إلى 30%.',
    icon: '🌳',
  },
  {
    id: 'tip-4',
    category: 'water',
    categoryLabel_en: 'Shower Conservation',
    categoryLabel_ar: 'ترشيد الاستحمام',
    fact_en: 'Trimming just 2 minutes off your daily shower saves up to 10 gallons (38 liters) of fresh water and significantly reduces water-heating energy.',
    fact_ar: 'تقليل وقت الاستحمام بدقيقتين فقط يوفر ما يصل إلى 38 لتراً من الماء النقي يومياً ويقلل طاقة تسخين المياه.',
    action_en: 'Installing an aerated low-flow showerhead pays for itself in water and heating savings within 2 months.',
    action_ar: 'تركيب مرشد تدفق المياه (Aerator) يوفر استهلاك المياه وتكلفتها خلال شهرين فقط.',
    icon: '💧',
  },
  {
    id: 'tip-5',
    category: 'waste',
    categoryLabel_en: 'Aluminum Recycling',
    categoryLabel_ar: 'إعادة تدوير الألومنيوم',
    fact_en: 'Recycling one aluminum can saves 95% of the energy needed to make a new one from raw bauxite ore—enough energy to power a TV for 3 hours!',
    fact_ar: 'إعادة تدوير علبة ألومنيوم واحدة يوفر 95% من الطاقة اللازمة لصنع علبة جديدة—طاقة تكفي لتشغيل تلفاز لمدة 3 ساعات!',
    action_en: 'Aluminum can be recycled indefinitely without losing its structural quality.',
    action_ar: 'يمكن إعادة تدوير الألومنيوم إلى ما لا نهاية دون أن يفقد جودته أو صلابته.',
    icon: '🥫',
  },
  {
    id: 'tip-6',
    category: 'lifestyle',
    categoryLabel_en: 'Food Waste',
    categoryLabel_ar: 'هدر الطعام والسماد',
    fact_en: 'Roughly 33% of all food produced globally is wasted. In landfills, rotting food releases methane, a greenhouse gas 28x more potent than CO2.',
    fact_ar: 'نحو 33% من إجمالي الغذاء المنتج عالمياً يُهدر. في مكبات النفايات، ينتج تعفن الطعام غاز الميثان وهو أشد خطورة بـ 28 مرة من ثاني أكسيد الكربون.',
    action_en: 'Composting vegetable peels, coffee grounds, and food scraps transforms waste into nutrient-dense soil for plants.',
    action_ar: 'تحويل بقايا الخضار وتفل القهوة إلى سماد عضوي منزلي يغذي التربة ويمنع انبعاثات الميثان.',
    icon: '🍎',
  },
  {
    id: 'tip-7',
    category: 'nature',
    categoryLabel_en: 'Pollinators & Bees',
    categoryLabel_ar: 'النحل وحماة التلقيح',
    fact_en: 'Over 75% of the world’s flowering plants and 35% of global food crops depend on bees, butterflies, and other pollinators to reproduce.',
    fact_ar: 'أكثر من 75% من النباتات المزهرة و35% من محاصيل الغذاء في العالم تعتمد على النحل والفراشات في عملية التلقيح.',
    action_en: 'Growing native flowering herbs like lavender, mint, and basil on balconies provides safe nectar stations for local bees.',
    action_ar: 'زراعة نباتات عطرية بلدية مثل اللافندر والنعناع والريحان يوفر محطات رحيق آمنة للنحل.',
    icon: '🐝',
  },
  {
    id: 'tip-8',
    category: 'energy',
    categoryLabel_en: 'LED Lighting',
    categoryLabel_ar: 'إضاءة الـ LED الذكية',
    fact_en: 'Residential LED bulbs use at least 75% less energy and last up to 25 times longer than traditional incandescent light bulbs.',
    fact_ar: 'تستهلك مصابيح الـ LED طاقة أقل بنسبة 75% على الأقل وتدوم حتى 25 ضعفاً مقارنة بالمصابيح المتوهجة القديمة.',
    action_en: 'Replacing just 5 of your home’s most frequently used bulbs with LEDs saves substantial electricity year-round.',
    action_ar: 'استبدال أكثر 5 مصابيح استخداماً في المنزل بمصابيح LED يخفض فاتورة الإضاءة بشكل فوري.',
    icon: '💡',
  },
  {
    id: 'tip-9',
    category: 'climate',
    categoryLabel_en: 'Laundry Eco-Cycle',
    categoryLabel_ar: 'غسيل الملابس بالماء البارد',
    fact_en: 'Up to 90% of the energy consumed by a washing machine is used strictly for heating water.',
    fact_ar: 'ما يصل إلى 90% من الطاقة التي تستهلكها الغسالة الكهربائية تُستخدم فقط لتسخين المياه.',
    action_en: 'Washing your clothes in cold water cleans just as effectively while cutting electricity usage per load by over 80%.',
    action_ar: 'غسل الملابس بالماء البارد يعطي نفس النظافة مع توفير أكثر من 80% من استهلاك الكهرباء لكل دورة غسيل.',
    icon: '🧺',
  },
  {
    id: 'tip-10',
    category: 'lifestyle',
    categoryLabel_en: 'Paperless Impact',
    categoryLabel_ar: 'تقليل استهلاك الورق',
    fact_en: 'Producing one ton of virgin paper requires roughly 24 trees, 7,000 gallons of water, and high amounts of chemical bleaching.',
    fact_ar: 'يتطلب إنتاج طن واحد من الورق الجديد قطع نحو 24 شجرة واستهلاك أكثر من 26 ألف لتر ماء وكميات هائلة من الطاقة.',
    action_en: 'Opting into electronic billing and utilizing digital note-keeping preserves natural forest ecosystems.',
    action_ar: 'الاعتماد على الفواتير الإلكترونية والملاحظات الرقمية يحمي الغابات الطبيعية ويقلل النفايات.',
    icon: '📄',
  },
];
