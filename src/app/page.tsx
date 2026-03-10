/**
 * Copyright (c) 2026 Tattoo Ideas Generator
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

'use client'

import { useState, useRef } from 'react'
import {
  Sparkles,
  Download,
  RefreshCw,
  Heart,
  Palette,
  Wand2,
  Gallery,
  Star,
  Zap
} from 'lucide-react'

interface TattooDesign {
  id: string
  prompt: string
  imageUrl: string
  style: string
  category: string
  liked: boolean
}

const tattooStyles = [
  { value: 'traditional', label: 'Traditional' },
  { value: 'realistic', label: 'Realistic' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'geometric', label: 'Geometric' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'tribal', label: 'Tribal' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'neo-traditional', label: 'Neo-Traditional' },
]

const tattooCategories = [
  { value: 'nature', label: 'Nature & Animals' },
  { value: 'spiritual', label: 'Spiritual & Symbolic' },
  { value: 'abstract', label: 'Abstract Art' },
  { value: 'portrait', label: 'Portraits' },
  { value: 'text', label: 'Text & Quotes' },
  { value: 'fantasy', label: 'Fantasy & Mythology' },
  { value: 'floral', label: 'Floral & Botanical' },
  { value: 'gothic', label: 'Gothic & Dark' },
]

export default function TattooIdeasGenerator() {
  const [designs, setDesigns] = useState<TattooDesign[]>([])
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('traditional')
  const [selectedCategory, setSelectedCategory] = useState('nature')
  const [favorites, setFavorites] = useState<TattooDesign[]>([])
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery' | 'favorites'>('generate')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateTattooIdea = async () => {
    if (!prompt.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/generate-tattoo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `${prompt}, ${selectedStyle} tattoo style, ${selectedCategory} theme, highly detailed, flash sheet style`,
          style: selectedStyle,
          category: selectedCategory,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const newDesign: TattooDesign = {
          id: Date.now().toString(),
          prompt,
          imageUrl: data.imageUrl,
          style: selectedStyle,
          category: selectedCategory,
          liked: false,
        }
        setDesigns(prev => [newDesign, ...prev])
      } else {
        console.error('Failed to generate tattoo')
      }
    } catch (error) {
      console.error('Error generating tattoo:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = (designId: string) => {
    const design = designs.find(d => d.id === designId)
    if (!design) return

    if (design.liked) {
      // Remove from favorites
      setFavorites(prev => prev.filter(f => f.id !== designId))
      setDesigns(prev => prev.map(d =>
        d.id === designId ? { ...d, liked: false } : d
      ))
    } else {
      // Add to favorites
      const updatedDesign = { ...design, liked: true }
      setFavorites(prev => [updatedDesign, ...prev])
      setDesigns(prev => prev.map(d =>
        d.id === designId ? { ...d, liked: true } : d
      ))
    }
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      generateTattooIdea()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/20 border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wand2 className="h-8 w-8 text-purple-400" />
              <h1 className="text-3xl font-bold text-white">Tattoo Ideas Generator</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="text-white font-medium">AI-Powered Design Studio</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-black/20 rounded-lg p-1 mb-8 max-w-md mx-auto">
          {[
            { key: 'generate', label: 'Generate', icon: Zap },
            { key: 'gallery', label: 'Gallery', icon: Gallery },
            { key: 'favorites', label: 'Favorites', icon: Heart },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${
                activeTab === key
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-purple-200 hover:text-white hover:bg-purple-700/30'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium">{label}</span>
              {key === 'favorites' && favorites.length > 0 && (
                <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Generate Tab */}
        {activeTab === 'generate' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-300/20 mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Your Perfect Tattoo Design</h2>

              <div className="space-y-6">
                {/* Prompt Input */}
                <div>
                  <label className="block text-purple-200 font-medium mb-2">Describe Your Tattoo Idea</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., A majestic dragon wrapped around a cherry blossom tree with flowing water..."
                    className="w-full px-4 py-3 bg-black/30 border border-purple-300/30 rounded-lg text-white placeholder-purple-300/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                {/* Style and Category Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-purple-200 font-medium mb-2">Tattoo Style</label>
                    <select
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-purple-300/30 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                      disabled={loading}
                    >
                      {tattooStyles.map(style => (
                        <option key={style.value} value={style.value} className="bg-slate-800">
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-purple-200 font-medium mb-2">Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 bg-black/30 border border-purple-300/30 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                      disabled={loading}
                    >
                      {tattooCategories.map(category => (
                        <option key={category.value} value={category.value} className="bg-slate-800">
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateTattooIdea}
                  disabled={loading || !prompt.trim()}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Generating Magic...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Generate Tattoo Design</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Tab */}
        {activeTab === 'gallery' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Design Gallery</h2>
            <TattooGrid
              designs={designs}
              onToggleFavorite={toggleFavorite}
              onDownload={downloadImage}
            />
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Favorite Designs</h2>
            <TattooGrid
              designs={favorites}
              onToggleFavorite={toggleFavorite}
              onDownload={downloadImage}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Tattoo Grid Component
function TattooGrid({
  designs,
  onToggleFavorite,
  onDownload
}: {
  designs: TattooDesign[]
  onToggleFavorite: (id: string) => void
  onDownload: (url: string, filename: string) => void
}) {
  if (designs.length === 0) {
    return (
      <div className="text-center py-12">
        <Palette className="h-16 w-16 text-purple-300/50 mx-auto mb-4" />
        <p className="text-purple-200 text-lg">No designs yet. Start creating!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {designs.map((design) => (
        <div
          key={design.id}
          className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-300/20 hover:border-purple-400/40 transition-all duration-300 group"
        >
          <div className="aspect-square relative overflow-hidden">
            <img
              src={design.imageUrl}
              alt={design.prompt}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2 right-2 flex space-x-2">
              <button
                onClick={() => onToggleFavorite(design.id)}
                className={`p-2 rounded-full backdrop-blur-sm transition-all duration-200 ${
                  design.liked
                    ? 'bg-pink-500 text-white'
                    : 'bg-black/30 text-white hover:bg-pink-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${design.liked ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => onDownload(design.imageUrl, `tattoo-${design.id}.png`)}
                className="p-2 bg-black/30 text-white rounded-full hover:bg-purple-600 transition-colors duration-200"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="p-4">
            <p className="text-white text-sm mb-2 line-clamp-2">{design.prompt}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-purple-600/30 text-purple-200 px-2 py-1 rounded">
                {design.style}
              </span>
              <span className="bg-pink-600/30 text-pink-200 px-2 py-1 rounded">
                {design.category}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}