import { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DeviceComparison from "@/components/comparison/DeviceComparison"

interface ComparisonPageProps {
  params: Promise<{ id: string }>
}

async function getComparison(id: string) {
  try {
    const comparison = await prisma.comparison.findUnique({
      where: { id },
      include: {
        devices: {
          orderBy: { order: "asc" },
          include: {
            device: {
              include: {
                brand: {
                  select: {
                    id: true,
                    name: true,
                    logo: true,
                  },
                },
                images: {
                  select: {
                    url: true,
                    alt: true,
                  },
                  orderBy: { order: "asc" },
                },
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            avatar: true,
          },
        },
      },
    })

    if (!comparison) {
      return null
    }

    // Check if comparison is public or user has access
    // For now, we'll allow access to all public comparisons
    if (!comparison.isPublic) {
      return null
    }

    return comparison
  } catch (error) {
    console.error("Error fetching comparison:", error)
    return null
  }
}

export async function generateMetadata({ params }: ComparisonPageProps): Promise<Metadata> {
  const resolvedParams = await params
  const comparison = await getComparison(resolvedParams.id)
  
  if (!comparison) {
    return {
      title: "Comparison Not Found | TechBlog",
    }
  }

  const deviceNames = comparison.devices.map(cd => cd.device.name).join(" vs ")
  const title = comparison.name || `${deviceNames} - Device Comparison`
  const description = comparison.description || `Compare ${deviceNames} specifications, features, and pricing side by side.`

  return {
    title: `${title} | TechBlog`,
    description,
    keywords: [
      "device comparison", 
      "mobile comparison", 
      ...comparison.devices.map(cd => cd.device.name),
      ...comparison.devices.map(cd => cd.device.brand.name),
    ],
    openGraph: {
      title: `${title} | TechBlog`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | TechBlog`,
      description,
    },
  }
}

export default async function ComparisonPage({ params }: ComparisonPageProps) {
  const resolvedParams = await params
  const comparison = await getComparison(resolvedParams.id)

  if (!comparison) {
    notFound()
  }

  // Transform the data to match the DeviceComparison component interface
  const devices = comparison.devices.map(cd => ({
    id: cd.device.id,
    name: cd.device.name,
    slug: cd.device.slug,
    model: cd.device.model,
    brand: {
      id: cd.device.brand.id,
      name: cd.device.brand.name,
      logo: cd.device.brand.logo,
    },
    launchPrice: cd.device.launchPrice ? Number(cd.device.launchPrice) : null,
    currentPrice: cd.device.currentPrice ? Number(cd.device.currentPrice) : null,
    currency: cd.device.currency,
    displaySize: cd.device.displaySize ? Number(cd.device.displaySize) : null,
    batteryCapacity: cd.device.batteryCapacity,
    ramConfigurations: cd.device.ramConfigurations,
    storageConfigurations: cd.device.storageConfigurations,
    operatingSystem: cd.device.operatingSystem,
    chipset: cd.device.chipset,
    releaseDate: cd.device.releaseDate ? cd.device.releaseDate.toISOString() : null,
    images: cd.device.images,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Comparison Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                {comparison.name}
              </h1>
              {comparison.description && (
                <p className="mt-1 text-sm text-gray-500">
                  {comparison.description}
                </p>
              )}
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>By {comparison.user?.name || "Anonymous"}</span>
                <span className="mx-2">•</span>
                <span>{devices.length} devices compared</span>
                <span className="mx-2">•</span>
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-800">
                  Public
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DeviceComparison 
        initialDevices={devices}
      />
    </div>
  )
}