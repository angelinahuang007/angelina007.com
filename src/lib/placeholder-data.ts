import { Project, BlogPost, SkillGroup, TimelineEvent } from '@/types';

export const FEATURED_PROJECTS: Project[] = [
  {
    id: '1',
    slug: 'neural-art-generator',
    title: 'Neural Art Generator',
    description: 'An AI-powered tool that generates unique artwork using neural networks and style transfer.',
    longDescription: 'This project combines deep learning with artistic expression, allowing users to generate stunning artwork through an intuitive interface. It uses state-of-the-art neural style transfer techniques to create unique pieces based on custom inputs and artistic parameters.',
    category: 'ml-ai',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234f46e5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%230ea5e9;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23grad1)"%3E%3C/rect%3E%3C/svg%3E',
    heroImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"%3E%3Cdefs%3E%3ClinearGradient id="grad1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234f46e5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%230ea5e9;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="600" fill="url(%23grad1)"%3E%3C/rect%3E%3C/svg%3E',
    techStack: ['Python', 'TensorFlow', 'React', 'Node.js', 'WebGL'],
    date: '2024-01-15',
    status: 'completed',
    demoUrl: 'https://neural-art-demo.example.com',
    githubUrl: 'https://github.com/angelina007/neural-art-generator',
    blogPostSlug: 'building-a-neural-art-generator',
    gallery: [
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234f46e5" /%3E%3Cstop offset="100%25" style="stop-color:%236366f1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23g1)"%3E%3C/rect%3E%3C/svg%3E',
    ],
  },
  {
    id: '2',
    slug: 'particle-engine',
    title: 'Real-time Particle Engine',
    description: 'A high-performance particle system built with WebGL for interactive visual effects.',
    longDescription: 'Built from the ground up with performance in mind, this particle engine handles millions of particles in real-time using GPU acceleration. It features advanced features like physics simulation, lighting, and interactive controls.',
    category: 'graphics',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Cdefs%3E%3ClinearGradient id="grad2" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23ec4899;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%238b5cf6;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23grad2)"%3E%3C/rect%3E%3C/svg%3E',
    heroImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"%3E%3Cdefs%3E%3ClinearGradient id="grad2" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23ec4899;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%238b5cf6;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="600" fill="url(%23grad2)"%3E%3C/rect%3E%3C/svg%3E',
    techStack: ['C++', 'WebGL', 'GLSL', 'Three.js'],
    date: '2024-02-20',
    status: 'completed',
    demoUrl: 'https://particle-engine-demo.example.com',
    githubUrl: 'https://github.com/angelina007/particle-engine',
    gallery: [
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Cdefs%3E%3ClinearGradient id="g3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23ec4899" /%3E%3Cstop offset="100%25" style="stop-color:%23f472b6" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23g3)"%3E%3C/rect%3E%3C/svg%3E',
    ],
  },
  {
    id: '3',
    slug: 'interactive-game',
    title: 'Isometric Adventure Game',
    description: 'A browser-based isometric game featuring dynamic lighting and interactive environments.',
    longDescription: 'A fully-fledged isometric game with engaging gameplay mechanics, beautiful pixel art, and environmental storytelling. Features include dynamic day-night cycles, NPC interactions, and puzzle-solving elements.',
    category: 'game-dev',
    thumbnail: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="400"%3E%3Cdefs%3E%3ClinearGradient id="grad3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2310b981;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%2314b8a6;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="600" height="400" fill="url(%23grad3)"%3E%3C/rect%3E%3C/svg%3E',
    heroImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1200" height="600"%3E%3Cdefs%3E%3ClinearGradient id="grad3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2310b981;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%2314b8a6;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1200" height="600" fill="url(%23grad3)"%3E%3C/rect%3E%3C/svg%3E',
    techStack: ['Godot', 'GDScript', 'Aseprite'],
    date: '2024-03-10',
    status: 'completed',
    demoUrl: 'https://game-demo.example.com',
    githubUrl: 'https://github.com/angelina007/isometric-game',
    gallery: [
      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Cdefs%3E%3ClinearGradient id="g4" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2310b981" /%3E%3Cstop offset="100%25" style="stop-color:%2334d399" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="400" fill="url(%23g4)"%3E%3C/rect%3E%3C/svg%3E',
    ],
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'building-a-neural-art-generator',
    title: 'Building a Neural Art Generator with TensorFlow',
    excerpt: 'Learn how to create an AI-powered art generator using neural style transfer and TensorFlow. We explore the technical implementation and creative possibilities.',
    content: `Introduction: Creating art with artificial intelligence is one of the most exciting frontiers in both computer science and creative expression. In this article, we'll explore how to build a neural art generator that can transform images using style transfer techniques.

Understanding Neural Style Transfer: Neural style transfer is a technique that uses deep learning to apply the artistic style of one image to the content of another. This is accomplished by training a convolutional neural network to extract and separate style features from content features. The process works by extracting feature representations from both the content image and style image, optimizing an output image to minimize the difference between feature maps, and iteratively refining the image to balance content preservation and style application.

Implementation Details: Our implementation uses TensorFlow and includes several key components: a feature extraction network based on VGG19, loss functions for style and content preservation, and an optimization algorithm to generate the final image. The technical architecture involves loading pre-trained VGG19 weights, creating custom layers for style and content loss, implementing an iterative optimization loop, and handling GPU acceleration for real-time processing.

Results and Future Work: The resulting neural art generator can process images in real-time and provides users with intuitive controls over the balance between artistic style and original content. Future improvements could include multi-style transfer, temporal coherence for video processing, and integration with generative models like GANs.

Conclusion: Neural style transfer demonstrates the powerful intersection of deep learning and artistic creativity. As these techniques continue to evolve, they open new possibilities for creative tools and artistic expression.`,
    coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Cdefs%3E%3ClinearGradient id="blog1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%234f46e5" /%3E%3Cstop offset="100%25" style="stop-color:%230ea5e9" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="400" fill="url(%23blog1)"%3E%3C/rect%3E%3C/svg%3E',
    date: '2024-01-20',
    readingTime: 8,
    tags: ['Machine Learning', 'AI', 'Python', 'TensorFlow', 'Art'],
    category: 'tutorial',
  },
  {
    id: '2',
    slug: 'mastering-webgl-performance',
    title: 'Mastering WebGL Performance Optimization',
    excerpt: 'Explore advanced techniques for optimizing WebGL applications, including batching, shader optimization, and GPU memory management.',
    content: `Introduction: WebGL is a powerful tool for creating interactive 3D graphics in the browser, but it requires careful optimization to achieve smooth performance. This article covers essential techniques for maximizing WebGL application performance.

GPU Batching and Draw Calls: One of the most critical optimizations in WebGL is reducing the number of draw calls. Every draw call has overhead, so batching multiple objects into a single draw call can dramatically improve performance. Key strategies include using instanced rendering for repeated geometries, combining meshes into single buffers, using texture atlases to reduce state changes, and implementing frustum culling to avoid rendering off-screen objects.

Shader Optimization: Shaders are where much of the computation happens in WebGL applications. Optimizing fragment and vertex shaders can yield significant performance improvements. Techniques include moving calculations from fragment shader to vertex shader when possible, reducing texture lookups, minimizing branching in shaders, and using lower precision types when appropriate.

Memory Management: Efficient GPU memory usage is crucial for performance. Strategies include texture compression, reducing buffer sizes, and careful management of framebuffer objects for optimal resource allocation and faster rendering.

Advanced Topics: For extremely demanding applications, techniques like multi-pass rendering for deferred shading, screen-space ambient occlusion, GPU-driven rendering pipelines, and advanced culling techniques can provide significant improvements.

Profiling and Debugging: Modern browsers include WebGL profiling tools that help identify bottlenecks. Using these tools to identify where time is spent is essential for effective optimization.

Conclusion: WebGL performance optimization is both an art and a science. By understanding the underlying hardware and applying these techniques, you can create responsive, high-performance 3D graphics in the browser.`,
    coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Cdefs%3E%3ClinearGradient id="blog2" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23ec4899" /%3E%3Cstop offset="100%25" style="stop-color:%238b5cf6" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="400" fill="url(%23blog2)"%3E%3C/rect%3E%3C/svg%3E',
    date: '2024-02-10',
    readingTime: 12,
    tags: ['WebGL', 'Graphics', 'Performance', 'Optimization', 'JavaScript'],
    category: 'technical',
  },
  {
    id: '3',
    slug: 'intersection-of-art-and-technology',
    title: 'The Intersection of Art and Technology',
    excerpt: 'Exploring how computational tools are revolutionizing artistic practice and creating new forms of creative expression.',
    content: `Introduction: The relationship between art and technology has always been symbiotic. From the invention of photography to the digital revolution, each technological advancement has opened new possibilities for artistic expression and creative exploration.

Digital Tools as Artistic Mediums: Modern artists now have access to tools that previous generations could only dream of. Digital painting, 3D modeling, generative art, and interactive installations have become mainstream forms of artistic practice. The democratization of these tools means that technical barriers to entry are lower than ever, allowing artists to explore ideas previously requiring large teams and significant resources.

Generative Art and Algorithm Design: Generative art uses algorithms and computational processes to create artwork. Rather than the artist directly creating every element, they define rules and parameters that guide the creative process. This approach has led to fascinating artistic movements including algorithmic composition in music, procedural generation in visual art, interactive installations that respond to viewer input, and AI-assisted art creation.

The Role of Code in Creative Practice: Code is increasingly recognized as a medium of artistic expression itself. Creative coding and live coding have become legitimate art forms, with artists exploring the intersection of logic, mathematics, and aesthetics through computational processes.

Emerging Technologies: New technologies continue to expand the boundaries of artistic possibility including virtual and augmented reality for immersive experiences, machine learning for creative collaboration, blockchain for digital art authentication, and real-time ray tracing for photorealistic graphics.

The Future of Creative Technology: As technology continues to evolve, the possibilities for artistic expression become increasingly limitless. The future likely holds even more intimate collaborations between human creativity and computational power.

Conclusion: The intersection of art and technology is not just about applying tools to art—it's about fundamentally expanding what art can be and how we think about creative expression in the digital age.`,
    coverImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Cdefs%3E%3ClinearGradient id="blog3" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%2310b981" /%3E%3Cstop offset="100%25" style="stop-color:%2314b8a6" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="800" height="400" fill="url(%23blog3)"%3E%3C/rect%3E%3C/svg%3E',
    date: '2024-03-05',
    readingTime: 10,
    tags: ['Art', 'Technology', 'Creative Coding', 'Digital Art', 'Innovation'],
    category: 'insights',
  },
];

export const SKILLS: SkillGroup[] = [
  {
    category: 'Languages',
    skills: ['Python', 'C++', 'JavaScript', 'TypeScript', 'GLSL', 'GDScript', 'Rust'],
  },
  {
    category: 'Frontend',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'Framer Motion', 'Three.js', 'Canvas API', 'WebGL'],
  },
  {
    category: 'Graphics & Game Dev',
    skills: ['WebGL', 'GLSL', 'Three.js', 'Godot', 'Unreal Engine', 'Blender', 'Aseprite'],
  },
  {
    category: 'Machine Learning',
    skills: ['TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'Neural Networks', 'Computer Vision', 'NLP'],
  },
  {
    category: 'Backend & Database',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Firebase', 'REST APIs', 'GraphQL'],
  },
  {
    category: 'Tools & Platforms',
    skills: ['Git', 'Docker', 'AWS', 'Vercel', 'GitHub', 'VS Code', 'Figma'],
  },
];

export const TIMELINE: TimelineEvent[] = [
  {
    year: '2024',
    title: 'AI Art Exploration',
    description: 'Started exploring generative art and neural style transfer, pushing the boundaries of computational creativity.',
  },
  {
    year: '2023',
    title: 'Graphics Programming',
    description: 'Deep dive into graphics programming, WebGL, and real-time rendering optimization techniques.',
  },
  {
    year: '2022',
    title: 'Full-Stack Development',
    description: 'Built multiple full-stack applications with React, Node.js, and modern web technologies.',
  },
  {
    year: '2021',
    title: 'Game Development Experiments',
    description: 'Created several indie games and interactive experiences using Godot and custom game engines.',
  },
  {
    year: '2020',
    title: 'Started Creative Coding',
    description: 'Began exploring the intersection of code and creative expression through generative art projects.',
  },
];

export const ABOUT_BIO = `Hi, I'm Angelina Huang, a creative technologist passionate about the intersection of computing and art. With a background in computer science and a love for visual design, I explore how code can be a medium for artistic expression.

My work spans multiple domains: from machine learning and graphics programming to interactive web applications and game development. I believe that the most interesting projects emerge at the intersection of technical skill and creative vision.

When I'm not coding, you can find me experimenting with new art tools, contributing to open-source projects, or sharing my thoughts on creative technology through writing and content creation.`;
