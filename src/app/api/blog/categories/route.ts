import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: 'asc'
      },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            blogPosts: true
          }
        }
      }
    });

    // Filter out categories with no blog posts
    const categoriesWithPosts = categories.filter(category => category._count.blogPosts > 0);

    return NextResponse.json(categoriesWithPosts);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}