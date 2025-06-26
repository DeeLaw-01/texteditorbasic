import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/api/api'
import useUserStore from '@/store/userStore'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, token, setUser } = useUserStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    profilePicture: ''
  })

  useEffect(() => {
    // Redirect if not logged in
    if (!token) {
      navigate('/login')
      return
    }

    // Set initial form data from user store
    if (user) {
      setFormData({
        name: user.name || '',
        profilePicture: user.profilePicture || ''
      })
    }
  }, [user, token, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const response = await api.put('/api/users/profile', formData)
      
      // Update user in store
      setUser(response.data)
      
      toast.success('Profile Updated', {
        description: 'Your profile has been updated successfully'
      })
      
      setIsEditing(false)
    } catch (error: any) {
      toast.error('Update Failed', {
        description: error.response?.data?.message || 'Something went wrong'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-20 pb-10 bg-black">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gray-900 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative">
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-blue-500">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                        Name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-300 mb-1">
                        Profile Picture URL
                      </label>
                      <input
                        id="profilePicture"
                        name="profilePicture"
                        type="text"
                        className="w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/your-image.jpg"
                        value={formData.profilePicture}
                        onChange={handleChange}
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        Enter a URL for your profile picture
                      </p>
                    </div>
                    
                    <div className="flex gap-3 justify-center sm:justify-start">
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          // Reset form data
                          if (user) {
                            setFormData({
                              name: user.name || '',
                              profilePicture: user.profilePicture || ''
                            })
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h1 className="text-2xl font-bold text-white">{user?.name}</h1>
                    <p className="text-gray-400 mt-1">{user?.email}</p>
                    <p className="text-gray-400 mt-1">
                      Account type: {user?.isGoogle ? 'Google' : 'Email'}
                    </p>
                    
                    <div className="mt-4">
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 px-6 py-4">
            <h2 className="text-lg font-medium text-white">Account Information</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-gray-700 p-4 rounded-md">
                <p className="text-sm text-gray-400">Email</p>
                <p className="text-white">{user?.email}</p>
              </div>
              <div className="bg-gray-700 p-4 rounded-md">
                <p className="text-sm text-gray-400">Account Created</p>
                <p className="text-white">
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString() 
                    : 'Not available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
