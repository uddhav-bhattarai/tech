import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed process...')

  // Clear existing data in correct order
  console.log('🧹 Cleaning existing data...')
  await prisma.comparisonDevice.deleteMany()
  await prisma.comparison.deleteMany()
  await prisma.review.deleteMany()
  await prisma.blogPost.deleteMany()
  await prisma.deviceImage.deleteMany()
  await prisma.device.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.category.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  await prisma.permission.deleteMany()

  // Create permissions
  console.log('🔑 Creating permissions...')
  const permissions = await Promise.all([
    prisma.permission.create({
      data: {
        name: 'read_profile',
        resource: 'user',
        action: 'read',
        description: 'Read own profile'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'create_review',
        resource: 'review',
        action: 'create',
        description: 'Create device reviews'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'create_blog',
        resource: 'blog',
        action: 'create',
        description: 'Create blog posts'
      }
    }),
    prisma.permission.create({
      data: {
        name: 'manage_devices',
        resource: 'device',
        action: 'manage',
        description: 'Manage all devices'
      }
    })
  ])

  // Create roles
  console.log('👥 Creating roles...')
  const userRole = await prisma.role.create({
    data: {
      name: 'USER',
      description: 'Standard user with basic permissions',
      permissions: {
        connect: [
          { id: permissions[0].id }, // read_profile
          { id: permissions[1].id }  // create_review
        ]
      }
    }
  })

  const adminRole = await prisma.role.create({
    data: {
      name: 'ADMIN',
      description: 'Administrator with full system access',
      permissions: {
        connect: permissions.map(p => ({ id: p.id }))
      }
    }
  })

  // Create users
  console.log('👤 Creating users...')
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@techblog.com',
      name: 'System Administrator',
      username: 'admin',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      verified: true,
      roleId: adminRole.id
    }
  })

  const demoUser = await prisma.user.create({
    data: {
      email: 'user@techblog.com',
      name: 'Demo User',
      username: 'demouser',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user',
      verified: true,
      roleId: userRole.id
    }
  })

  // Create additional users for reviews
  const photographerUser = await prisma.user.create({
    data: {
      email: 'photographer@techblog.com',
      name: 'Alex Photography',
      username: 'alexphoto',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=photographer',
      verified: true,
      roleId: userRole.id
    }
  })

  const gamerUser = await prisma.user.create({
    data: {
      email: 'gamer@techblog.com',
      name: 'Mobile Gamer Pro',
      username: 'gamerpro',
      password: hashedPassword,
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gamer',
      verified: true,
      roleId: userRole.id
    }
  })

  // Create device categories
  console.log('📱 Creating device categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Smartphones',
        slug: 'smartphones',
        description: 'Mobile phones with advanced computing capabilities'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Tablets',
        slug: 'tablets',
        description: 'Large screen mobile devices'
      }
    }),
    prisma.category.create({
      data: {
        name: 'Wearables',
        slug: 'wearables',
        description: 'Smart watches and fitness trackers'
      }
    })
  ])

  // Create brands
  console.log('🏢 Creating brands...')
  const brands = await Promise.all([
    prisma.brand.create({
      data: {
        name: 'Apple',
        slug: 'apple',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
        website: 'https://www.apple.com',
        description: 'American multinational technology company',
        founded: 1976,
        country: 'United States'
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Samsung',
        slug: 'samsung',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg',
        website: 'https://www.samsung.com',
        description: 'South Korean multinational electronics company',
        founded: 1938,
        country: 'South Korea'
      }
    }),
    prisma.brand.create({
      data: {
        name: 'Google',
        slug: 'google',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
        website: 'https://www.google.com',
        description: 'American multinational technology company',
        founded: 1998,
        country: 'United States'
      }
    })
  ])

  // Create tags
  console.log('🏷️ Creating tags...')
  const tags = await Promise.all([
    prisma.tag.create({
      data: { name: 'smartphone', slug: 'smartphone' }
    }),
    prisma.tag.create({
      data: { name: 'iPhone', slug: 'iphone' }
    }),
    prisma.tag.create({
      data: { name: 'Android', slug: 'android' }
    }),
    prisma.tag.create({
      data: { name: 'flagship', slug: 'flagship' }
    })
  ])

  // Create devices
  console.log('📱 Creating devices...')
  const iphone15Pro = await prisma.device.create({
    data: {
      name: 'iPhone 15 Pro',
      model: 'A3101',
      slug: 'apple-iphone-15-pro',
      brandId: brands[0].id, // Apple
      releaseDate: new Date('2023-09-22'),
      launchPrice: 999,
      currentPrice: 999,
      currency: 'USD',
      availability: 'available',
      chipset: 'A17 Pro',
      displaySize: 6.1,
      batteryCapacity: 3274,
      ramConfigurations: [8],
      storageConfigurations: [128, 256, 512, 1024],
      operatingSystem: 'iOS 17',
      categories: {
        connect: { id: categories[0].id } // Smartphones
      },
      tags: {
        connect: [
          { id: tags[0].id }, // smartphone
          { id: tags[1].id }, // iPhone
          { id: tags[3].id }  // flagship
        ]
      }
    }
  })

  const galaxyS24Ultra = await prisma.device.create({
    data: {
      name: 'Galaxy S24 Ultra',
      model: 'SM-S928B',
      slug: 'samsung-galaxy-s24-ultra',
      brandId: brands[1].id, // Samsung
      releaseDate: new Date('2024-01-24'),
      launchPrice: 44999, // NPR base price
      currentPrice: 44999,
      currency: 'NPR',
      availability: 'available',
      chipset: 'Snapdragon 8 Gen 3 for Galaxy',
      displaySize: 6.8,
      batteryCapacity: 5000,
      ramConfigurations: [8, 12],
      storageConfigurations: [128, 256, 512, 1024],
      operatingSystem: 'Android 14',
      categories: {
        connect: { id: categories[0].id } // Smartphones
      },
      tags: {
        connect: [
          { id: tags[0].id }, // smartphone
          { id: tags[2].id }, // Android
          { id: tags[3].id }  // flagship
        ]
      }
    }
  })

  const pixel8Pro = await prisma.device.create({
    data: {
      name: 'Pixel 8 Pro',
      model: 'GC3VE',
      slug: 'google-pixel-8-pro',
      brandId: brands[2].id, // Google
      releaseDate: new Date('2023-10-12'),
      launchPrice: 999,
      currentPrice: 899,
      currency: 'USD',
      availability: 'available',
      chipset: 'Google Tensor G3',
      displaySize: 6.7,
      batteryCapacity: 5050,
      ramConfigurations: [12],
      storageConfigurations: [128, 256, 512],
      operatingSystem: 'Android 14',
      categories: {
        connect: { id: categories[0].id } // Smartphones
      },
      tags: {
        connect: [
          { id: tags[0].id }, // smartphone
          { id: tags[2].id }, // Android
          { id: tags[3].id }  // flagship
        ]
      }
    }
  })

  // Add device images
  console.log('🖼️ Adding device images...')
  await Promise.all([
    prisma.deviceImage.create({
      data: {
        deviceId: iphone15Pro.id,
        url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium.jpg',
        alt: 'iPhone 15 Pro in Natural Titanium',
        type: 'main',
        order: 1
      }
    }),
    prisma.deviceImage.create({
      data: {
        deviceId: galaxyS24Ultra.id,
        url: 'https://www.samsungplaza.com.np/public/files/B37F1070BCC4DEC-Galaxy%20S24%20Camera%20Overview.jpg',
        alt: 'Samsung Galaxy S24 Ultra Camera Overview',
        type: 'main',
        order: 1
      }
    }),
    prisma.deviceImage.create({
      data: {
        deviceId: pixel8Pro.id,
        url: 'https://lh3.googleusercontent.com/UB_k8rnfSSMLgqnL2wMhVLCh9k2_Vr0zZ0j5iJ_cqbAyPnMY2rLBhSJfLcWxWJbOPjg',
        alt: 'Google Pixel 8 Pro',
        type: 'main',
        order: 1
      }
    })
  ])

  // Create blog posts
  console.log('📖 Creating blog posts...')
  await prisma.blogPost.create({
    data: {
      title: 'iPhone 15 Pro Review: The Titanium Revolution',
      slug: 'iphone-15-pro-review-titanium-revolution',
      excerpt: 'Apple\'s latest flagship brings titanium design and the powerful A17 Pro chip. Is it worth the upgrade?',
      contentType: 'TRADITIONAL',
      contentData: {
        type: 'traditional',
        content: `# iPhone 15 Pro Review: The Titanium Revolution

The iPhone 15 Pro represents a significant leap forward in Apple's smartphone evolution. With its titanium construction and groundbreaking A17 Pro chip, this device sets new standards for premium smartphones.

## Design and Build Quality

The switch to titanium is immediately noticeable. The iPhone 15 Pro feels lighter yet more premium than its steel predecessors.

## Performance

The A17 Pro chip delivers exceptional performance across all tasks. From demanding games to professional video editing, this phone handles everything with ease.

## Camera System

The 48MP main camera produces stunning results in all lighting conditions. The new 5x telephoto lens brings professional photography capabilities to your pocket.

## Conclusion

The iPhone 15 Pro is Apple's most refined smartphone to date. While expensive, it justifies its price with premium materials, cutting-edge performance, and exceptional cameras.

**Rating: 9/10**`
      },
      content: `# iPhone 15 Pro Review: The Titanium Revolution

The iPhone 15 Pro represents a significant leap forward in Apple's smartphone evolution. With its titanium construction and groundbreaking A17 Pro chip, this device sets new standards for premium smartphones.

## Design and Build Quality

The switch to titanium is immediately noticeable. The iPhone 15 Pro feels lighter yet more premium than its steel predecessors.

## Performance

The A17 Pro chip delivers exceptional performance across all tasks. From demanding games to professional video editing, this phone handles everything with ease.

## Camera System

The 48MP main camera produces stunning results in all lighting conditions. The new 5x telephoto lens brings professional photography capabilities to your pocket.

## Conclusion

The iPhone 15 Pro is Apple's most refined smartphone to date. While expensive, it justifies its price with premium materials, cutting-edge performance, and exceptional cameras.

**Rating: 9/10**`,
      status: 'PUBLISHED',
      publishedAt: new Date('2023-10-01T10:00:00Z'),
      authorId: adminUser.id,
      categories: {
        connect: { id: categories[0].id }
      },
      tags: {
        connect: [
          { id: tags[0].id }, // smartphone
          { id: tags[1].id }, // iPhone
          { id: tags[3].id }  // flagship
        ]
      }
    }
  })

  // Samsung Galaxy S24 Ultra comprehensive review
  await prisma.blogPost.create({
    data: {
      title: 'Samsung Galaxy S24 Ultra Review: The Ultimate Flagship with AI Power & a Record-Breaking Camera',
      slug: 'samsung-galaxy-s24-ultra-review-ultimate-flagship-ai-camera',
      excerpt: 'The Samsung Galaxy S24 Ultra is a premium flagship that blends design elegance with extreme performance, featuring AI-powered features and an incredible camera system.',
      contentType: 'MARKDOWN',
      contentData: {
        type: 'markdown',
        content: `# 📱 Samsung Galaxy S24 Ultra – Full Tech Review

![Samsung S24 Ultra Camera Overview](https://www.samsungplaza.com.np/public/files/B37F1070BCC4DEC-Galaxy%20S24%20Camera%20Overview.jpg)

**Starting Price (Nepal):** NPR 44,999 (base variant, 8/128GB)

**Expert Ratings:**
- ⭐ Display: 4.7/5
- ⭐ Performance: 4.6/5
- ⭐ Battery: 4.5/5
- ⭐ Camera: 4.2/5
- ⭐ Value: 4.6/5

**Overall Score: 4.6/5**

## Phone Overview

The **Samsung Galaxy S24 Ultra** is a premium flagship that blends design elegance with extreme performance. It features a **6.8-inch QHD+ LTPO AMOLED display** with adaptive 120Hz refresh, HDR10+ support, and peak brightness of 2600 nits for superb outdoor visibility. Inside, it's powered by the **Snapdragon 8 Gen 3 for Galaxy** processor paired with up to **12GB RAM** and **1TB storage**. The rear camera system includes a **200MP main**, **12MP ultra-wide**, **10MP telephoto (3x)**, and **50MP periscope telephoto (5x)**—making it a beast for zoom and detail shots. A **12MP front camera** handles selfies. Backed by a **5000mAh battery** with **45W wired** and **15W wireless charging**, it delivers all-day endurance.

## Key Highlights

- **Display:** 6.8″ QHD+ LTPO AMOLED, 1–120Hz, HDR10+
- **Processor:** Snapdragon 8 Gen 3 for Galaxy
- **RAM/Storage:** 8GB/12GB | 128GB – 1TB (UFS 4.0)
- **Cameras:** Quad setup – 200MP + 12MP + 10MP (3x) + 50MP (5x) | 12MP front
- **Battery:** 5000mAh, 45W wired, 15W wireless, reverse wireless
- **Software:** Android 14, One UI 6.1, 7 years updates
- **Audio:** Stereo speakers, Dolby Atmos, no 3.5mm jack
- **Connectivity:** 5G, Wi-Fi 7, Bluetooth 5.3, NFC, USB-C 3.2

## Conclusion

The **Samsung Galaxy S24 Ultra** is the ultimate choice for **power users, creators, and photographers** who want a premium, future-proof flagship. With its massive camera system, long software support, and robust titanium design, it stands tall as one of the **best all-round smartphones** of 2024–25. If you can afford it, this is a **buy without hesitation**.

**Final Rating: 4.6/5 ⭐**`
      },
      content: `# Samsung Galaxy S24 Ultra – Full Tech Review

The Samsung Galaxy S24 Ultra is a premium flagship that blends design elegance with extreme performance...

**Final Rating: 4.6/5 ⭐**`,
      status: 'PUBLISHED',
      publishedAt: new Date('2024-02-15T10:00:00Z'),
      authorId: adminUser.id,
      categories: {
        connect: { id: categories[0].id }
      },
      tags: {
        connect: [
          { id: tags[0].id }, // smartphone
          { id: tags[2].id }, // Android
          { id: tags[3].id }  // flagship
        ]
      }
    }
  })

  // Create device reviews
  console.log('⭐ Creating device reviews...')
  await Promise.all([
    prisma.review.create({
      data: {
        rating: 5,
        title: 'Exceptional build quality and performance',
        content: 'The iPhone 15 Pro exceeded my expectations. The titanium build feels premium and the camera quality is outstanding.',
        deviceId: iphone15Pro.id,
        userId: demoUser.id
      }
    }),
    prisma.review.create({
      data: {
        rating: 5,
        title: 'Ultimate flagship experience - S24 Ultra delivers everything!',
        content: `Just got the Galaxy S24 Ultra and I'm blown away! The 6.8" display with 2600 nits brightness is incredible - I can use it perfectly even under direct sunlight. The Snapdragon 8 Gen 3 handles everything I throw at it, from intense gaming sessions to multitasking with DeX mode.

The camera system is phenomenal. That 200MP main sensor captures insane detail, and the 5x periscope zoom is a game-changer for photography. I've been taking shots from across the room that look like I was standing right next to the subject. The S Pen integration is seamless - perfect for note-taking and photo editing on the go.

Battery easily gets me through a full day of heavy usage, and the 45W charging is decent. The titanium build feels premium and the IP68 rating gives me confidence to use it anywhere.

Galaxy AI features like live translation and circle-to-search are incredibly useful in daily life. Plus knowing I'll get 7 years of updates makes this a great long-term investment.

Only minor complaint is no charger in the box, but honestly, this phone is worth every rupee. Best Android flagship I've ever used!`,
        deviceId: galaxyS24Ultra.id,
        userId: demoUser.id
      }
    }),
    prisma.review.create({
      data: {
        rating: 4,
        title: 'Professional photographer\'s perspective on S24 Ultra',
        content: `As a professional photographer, I was excited to test the Galaxy S24 Ultra's camera capabilities. The 200MP main sensor produces excellent results with great dynamic range and color accuracy. The zoom system is impressive - the 5x periscope telephoto maintains quality even when pushed further.

Night photography has improved significantly with better noise reduction. The Expert RAW mode gives me the flexibility I need for serious photo editing. Video stabilization across all lenses is outstanding for handheld shooting.

The display quality makes photo review and editing a pleasure. Battery life easily handles a full day of intensive camera use. Build quality feels professional-grade.

My only critique is the aggressive processing in some scenarios - sometimes I prefer more natural results. But overall, this is the most capable smartphone camera system I've used. Highly recommended for content creators and photography enthusiasts.`,
        deviceId: galaxyS24Ultra.id,
        userId: photographerUser.id
      }
    }),
    prisma.review.create({
      data: {
        rating: 4,
        title: 'Pure Android experience',
        content: 'Google\'s Pixel phones always deliver the cleanest Android experience. The AI photography features are impressive.',
        deviceId: pixel8Pro.id,
        userId: adminUser.id
      }
    }),
    prisma.review.create({
      data: {
        rating: 5,
        title: 'Gaming beast with incredible display',
        content: `Bought the S24 Ultra primarily for mobile gaming and it absolutely delivers! The Snapdragon 8 Gen 3 with boosted Adreno 750 GPU handles every game at maximum settings. PUBG runs at stable 120fps, Genshin Impact maintains 60fps with minimal drops.

The 6.8" QHD+ AMOLED display is perfection for gaming - colors are vibrant, blacks are deep, and the 120Hz refresh makes everything buttery smooth. The adaptive refresh rate helps with battery life too.

Thermals are well managed - even during 2-3 hour gaming sessions, it barely gets warm. The 5000mAh battery easily handles extended gaming, and the stereo speakers with Dolby Atmos create an immersive experience.

S Pen is surprisingly useful for strategy games and drawing apps. Overall, this is the ultimate gaming smartphone right now!`,
        deviceId: galaxyS24Ultra.id,
        userId: gamerUser.id
      }
    })
  ])

  // Create device comparison
  console.log('🔄 Creating device comparisons...')
  const comparison = await prisma.comparison.create({
    data: {
      name: 'iPhone 15 Pro vs Galaxy S24 Ultra',
      description: 'Ultimate flagship comparison between Apple and Samsung\'s best',
      userId: adminUser.id,
      isPublic: true
    }
  })

  // Add devices to comparison
  await Promise.all([
    prisma.comparisonDevice.create({
      data: {
        comparisonId: comparison.id,
        deviceId: iphone15Pro.id,
        order: 1
      }
    }),
    prisma.comparisonDevice.create({
      data: {
        comparisonId: comparison.id,
        deviceId: galaxyS24Ultra.id,
        order: 2
      }
    })
  ])

  console.log('✅ Seed completed successfully!')
  console.log(`
🎉 Database seeded with:
   • 4 Permissions
   • 2 Roles (USER, ADMIN)
   • 4 Users (admin, demo user, photographer, gamer)
   • 3 Device Categories
   • 3 Brands (Apple, Samsung, Google)
   • 3 Devices with images
   • 4 Tags
   • 2 Blog Posts (including comprehensive Galaxy S24 Ultra review)
   • 5 Device Reviews (3 detailed S24 Ultra reviews from different users)
   • 1 Device Comparison

🔐 Login Credentials:
   Admin: admin@techblog.com / password123
   Demo User: user@techblog.com / password123
   Photographer: photographer@techblog.com / password123
   Gamer: gamer@techblog.com / password123

📱 Featured Content:
   • Samsung Galaxy S24 Ultra comprehensive review with Nepal pricing
   • Multiple user reviews from different perspectives (general user, photographer, gamer)
   • Complete specifications and comparisons
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })