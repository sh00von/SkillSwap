import Link from "next/link"

interface SkillCardProps {
  _id: string
  title: string
  description: string
  category: string
  experience: string
  location: string
  user: {
    username: string
  }
  reviews?: {
    rating: number
    comment: string
    user: {
      username: string
    }
  }[]
}

export default function SkillCard({
  _id,
  title,
  description,
  category,
  experience,
  location,
  user,
  reviews = [],
}: SkillCardProps) {
  // Calculate average rating
  const getAverageRating = () => {
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  return (
    <Link href={`/skills/${_id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-semibold mb-2 text-indigo-700">{title}</h2>
            <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">{category}</span>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-2">{description}</p>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <span className="text-yellow-500 mr-1">★</span>
              <span>{getAverageRating()}</span>
              <span className="text-gray-500 ml-1">({reviews.length} reviews)</span>
            </div>
            <div className="text-gray-500">{location}</div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-sm text-gray-500">Experience: {experience}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
