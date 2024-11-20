'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Upload, Car, Menu, CheckCircle, Download, ChevronDown, ChevronUp, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { pdf } from '@react-pdf/renderer'
import { QuotePDF } from './QuotePDF'
import { PDFDownloadLink } from '@react-pdf/renderer'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

const phases = [
  {
    title: "Checking Damage",
    description: "Analyzing image for vehicle damage...",
    completeDescription: (hasDamage: boolean | null) => 
      hasDamage === null 
        ? "Analyzing image for vehicle damage..." 
        : hasDamage 
          ? "✅ Vehicle damage detected" 
          : "❌ No vehicle damage detected",
    demoDescription: "AI model analyzing for presence of damage..."
  },
  {
    title: "Identifying Vehicle",
    description: "Sending to AI model for vehicle identification...",
    completeDescription: (vehicle: { make: string; model: string; year: number } | null) => 
      vehicle ? `Vehicle identified as ${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Sending to AI model for vehicle identification...",
    demoDescription: "AI model analyzing vehicle make and model..."
  },
  {
    title: "Analyzing Damage",
    description: "Processing through damage analysis model...",
    demoDescription: "AI model analyzing damage patterns and severity..."
  },
  {
    title: "Finding Parts",
    description: "Searching OEM and aftermarket databases...",
    demoDescription: "Searching parts databases and comparing prices..."
  },
  {
    title: "Estimating Labor",
    description: "Calculating labor rates and time estimates...",
    demoDescription: "Calculating repair time and labor costs..."
  },
  {
    title: "Finalizing Claim",
    description: "✨ Generating your quote ✨",
    demoDescription: "Preparing final quote details..."
  }
] as const;

const vehicles = [
  { make: "Range Rover", model: "Evoque", year: 2023 },
  { make: "Toyota", model: "Camry", year: 2020 },
  { make: "Honda", model: "Civic", year: 2021 },
  { make: "Ford", model: "F-150", year: 2019 },
  { make: "Tesla", model: "Model 3", year: 2022 },
  { make: "BMW", model: "330i", year: 2021 },
  { make: "Volkswagen", model: "Golf", year: 2020 }
]

const allRepairItems = [
  { part: "Front Bumper", damage: "Dent and scratch", repair: "Replace and paint", cost: 850 },
  { part: "Hood", damage: "Multiple dents", repair: "Paintless Dent Repair (PDR)", cost: 450 },
  { part: "Left Front Door", damage: "Deep scratch", repair: "Sand, fill, and paint", cost: 600 },
  { part: "Right Fender", damage: "Crumpled", repair: "Replace and paint", cost: 1200 },
  { part: "Windshield", damage: "Cracked", repair: "Replace", cost: 800 },
  { part: "Headlight", damage: "Broken", repair: "Replace", cost: 350 },
  { part: "Side Mirror", damage: "Damaged housing", repair: "Replace and paint", cost: 250 },
  { part: "Rear Bumper", damage: "Major scratch", repair: "Sand and paint", cost: 550 },
  { part: "Trunk", damage: "Dent", repair: "PDR", cost: 400 },
  { part: "Quarter Panel", damage: "Deep dent", repair: "Replace and paint", cost: 1400 }
]

const generateClaimNumber = () => {
  const randomNum = Math.floor(Math.random() * 100000).toString().padStart(5, '0')
  return `BD${randomNum}`
}

type PhaseData = {
  [key: number]: {
    confidence?: number;
    make?: string;
    model?: string;
    year?: number;
    timestamp?: string;
    status?: string;
    processingStart?: number;
    processingTime?: number;
    damageTypes?: string[];
    severity?: string;
    affectedAreas?: string[];
    partsRequired?: any[];
    laborHours?: number;
    laborRate?: number;
    estimatedDuration?: string;
    specialistRequired?: boolean;
    claimNumber?: string;
    totalParts?: number;
    totalCost?: number;
    laborCost?: number;
    partsCost?: number;
    estimatedCompletion?: string;
    hasDamage?: boolean;
    damagedParts?: string[];
    pricedParts?: Array<{
      part: string;
      cost: number;
      repair: string;
      damage: string;
    }>;
    details?: string;
  };
};

// First, let's create a type for our LLM interaction details
type LLMInteractionDetails = {
  model: string;
  prompt: string;
  response: string;
}

export function BodyDamageQuote() {
  const { logout } = useAuth()
  const router = useRouter()
  const [image, setImage] = useState<File | null>(null)
  const [currentPhase, setCurrentPhase] = useState(0)
  const [showQuote, setShowQuote] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState<typeof vehicles[0] | null>(null)
  const [repairItems, setRepairItems] = useState<typeof allRepairItems>([])
  const [identificationProgress, setIdentificationProgress] = useState(0)
  const [claimNumber, setClaimNumber] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [canProgress, setCanProgress] = useState(false)
  const [phaseData, setPhaseData] = useState<PhaseData>({})
  const [expandedJson, setExpandedJson] = useState<number | null>(null)
  const [llmDetails, setLLMDetails] = useState<LLMInteractionDetails | null>(null);
  const [apiConfig, setApiConfig] = useState<{ ollamaApiUrl: string } | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch('/api/config');
        const config = await response.json();
        setApiConfig(config);
      } catch (error) {
        console.error('Error fetching API config:', error);
      }
    };
    
    fetchConfig();
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0]
      
      // Check if file type is jpeg or gif
      if (!['image/jpeg', 'image/gif'].includes(file.type)) {
        alert('Please upload only JPEG or GIF files')
        return
      }
      
      setImage(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)
    }
  }

  useEffect(() => {
    return () => {
      // Cleanup preview URL when component unmounts
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  const identifyVehicle = async (file: File) => {
    console.log('🚀 Frontend: Starting vehicle identification process', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    const formData = new FormData()
    formData.append('image', file)

    try {
      console.log('📤 Frontend: Sending image to API')
      const response = await fetch('/api/identify-vehicle', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      console.log('📥 Frontend: Vehicle identification response:', data)

      // Set LLM details when we get the response
      setLLMDetails({
        model: "LLaVA 7B",
        prompt: "What kind of car is this? Only return make and model in the format of make: <make>, model: <model>. No other words.",
        response: data.rawResponse || `make: ${data.make}, model: ${data.model}`
      })

      if (data.make && data.model) {
        // Try to find exact match first
        const exactMatch = vehicles.find(
          v => v.make.toLowerCase() === data.make.toLowerCase() && 
               v.model.toLowerCase() === data.model.toLowerCase()
        )
        
        if (exactMatch) {
          console.log('✨ Frontend: Found exact match:', exactMatch)
          return exactMatch
        }
        
        // If no exact match, create a new vehicle entry with random year between 2016-2022
        const randomYear = Math.floor(Math.random() * (2022 - 2016 + 1)) + 2016
        const newVehicle = {
          make: data.make,
          model: data.model,
          year: randomYear
        }
        console.log('✨ Frontend: Created new vehicle entry:', newVehicle)
        return newVehicle
      }
      
      console.log('⚠️ Frontend: No match found, using fallback')
      const fallbackVehicle = vehicles[0]
      console.log('🔄 Frontend: Selected fallback vehicle:', fallbackVehicle)
      return fallbackVehicle

    } catch (error) {
      console.error('💥 Frontend Error:', error)
      const fallbackVehicle = vehicles[0]
      console.log('🔄 Frontend: Selected error fallback vehicle:', fallbackVehicle)
      return fallbackVehicle
    }
  }

  const checkDamage = async (file: File) => {
    console.log('🚀 Frontend: Starting damage check process', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    const formData = new FormData()
    formData.append('image', file)

    try {
      console.log('📤 Frontend: Sending image to damage check API')
      const response = await fetch('/api/check-damage', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      console.log('📥 Frontend: Damage check response:', data)

      // Set LLM details when we get the response
      setLLMDetails({
        model: "LLaVA 7B",
        prompt: "Is there any visible damage to this vehicle? Answer only 'true' if damage is visible, or 'false' if no damage is visible.",
        response: data.rawResponse || String(data.hasDamage)
      })

      if (data.hasDamage !== undefined) {
        console.log('✨ Frontend: Damage check result:', data.hasDamage)
        return data
      }
      
      console.log('⚠️ Frontend: Invalid response, using fallback')
      return { hasDamage: true } // Fallback to assuming damage in demo/error cases
    } catch (error) {
      console.error('💥 Frontend: Error in damage check:', error)
      return { hasDamage: true } // Fallback on error
    }
  }

  const startProcessing = async () => {
    if (!image) {
      console.log('⚠️ Frontend: No image provided')
      return
    }

    console.log('🎬 Frontend: Starting processing')
    setIsProcessing(true)
    setCurrentPhase(0)
    setShowQuote(false)
    setIdentificationProgress(0)
    setClaimNumber(generateClaimNumber())
    
    // Initialize phase data for damage check
    setPhaseData(prevData => ({
      ...prevData,
      0: {
        status: "processing",
        timestamp: new Date().toISOString(),
        imageSize: image.size,
        imageType: image.type,
        processingStart: Date.now()
      }
    }))

    // Animate progress during check
    const progressInterval = setInterval(() => {
      setIdentificationProgress(prev => {
        if (prev >= 20) {
          clearInterval(progressInterval)
          return 20
        }
        return prev + 1
      })
    }, 100)

    try {
      // Phase 0: Check for Damage
      console.log('🔍 Frontend: Starting damage check')
      const damageCheck = await checkDamage(image)
      console.log('✅ Frontend: Damage check complete:', damageCheck)
      
      // Check if we got an error response
      if (damageCheck.rawResponse?.startsWith('Error:')) {
        console.error('❌ Frontend: LLM Error in damage check')
        clearInterval(progressInterval)
        setIsProcessing(true) // Keep processing state to show error UI
        // Show error state and require restart
        setPhaseData(prevData => ({
          ...prevData,
          0: {
            status: "error",
            error: "Failed to process image. Please try a different image format or try again later.",
            timestamp: new Date().toISOString()
          }
        }))
        return
      }
      
      setPhaseData(prevData => ({
        ...prevData,
        0: {
          hasDamage: damageCheck.hasDamage,
          confidence: 0.95,
          processingTime: Date.now() - prevData[0]?.processingStart,
          timestamp: new Date().toISOString(),
          status: "complete"
        }
      }))

      // Handle no damage case differently for demo and non-demo modes
      if (!damageCheck.hasDamage) {
        clearInterval(progressInterval)
        if (isDemoMode) {
          setCanProgress(true) // Allow clicking Next in demo mode
        } else {
          setIsProcessing(false)
          setShowQuote(false)
        }
        return
      }

      // Set canProgress for demo mode
      if (isDemoMode) {
        setCanProgress(true)
        // Initialize phase data for next phase only
        setPhaseData(prevData => ({
          ...prevData,
          1: { // Add initial data for vehicle identification phase
            status: "pending"
          }
        }))
        clearInterval(progressInterval)
        return // Stop here in demo mode and wait for manual progression
      }

      // Continue with vehicle identification and rest of the process for non-demo mode
      setCurrentPhase(1)
      const identifiedVehicle = await identifyVehicle(image)
      setSelectedVehicle(identifiedVehicle)

      // Continue with the rest of the processing
      setTimeout(() => {
        clearInterval(progressInterval)
        const numberOfItems = Math.floor(Math.random() * 3) + 3
        const shuffledItems = [...allRepairItems].sort(() => Math.random() - 0.5)
        const selectedItems = shuffledItems.slice(0, numberOfItems)
        setRepairItems(selectedItems)
        console.log('📋 Frontend: Selected repair items:', selectedItems)

        // Original non-demo behavior
        let currentPhaseIndex = 2 // Start from phase 2 now
        const interval = setInterval(() => {
          if (currentPhaseIndex >= phases.length - 1) {
            clearInterval(interval)
            setIsProcessing(false)
            setShowQuote(true)
            console.log('🎉 Frontend: Processing complete')
            return
          }
          console.log('📈 Frontend: Moving to phase:', currentPhaseIndex + 1)
          setCurrentPhase(currentPhaseIndex)
          currentPhaseIndex++
        }, 3000)
      }, 3000)
    } catch (error) {
      console.error('💥 Frontend: Error in processing:', error)
      clearInterval(progressInterval)
      setIsProcessing(false)
    }
  }

  const totalCost = repairItems.reduce((sum, item) => sum + item.cost, 0)

  const handleNewClaim = () => {
    setImage(null)
    setImagePreview(null)
    setCurrentPhase(0)
    setShowQuote(false)
    setIsProcessing(false)
    setSelectedVehicle(null)
    setRepairItems([])
  }

  const handleNextPhase = async () => {
    if (currentPhase >= phases.length - 1) {
      setIsProcessing(false)
      setShowQuote(true)
      return
    }
    
    // Check if current phase is damage check and no damage was detected
    if (currentPhase === 0 && phaseData[0]?.hasDamage === false) {
      setIsProcessing(false)
      setShowQuote(false)
      return
    }
    
    const newPhase = currentPhase + 1
    setCurrentPhase(newPhase)
    setCanProgress(false)
    
    // Clear previous LLM details when transitioning phases
    setLLMDetails(null)
    
    // Special handling for vehicle identification phase
    if (newPhase === 1) {
      try {
        // Set phase to processing state
        setPhaseData(prevData => ({
          ...prevData,
          1: {
            status: "processing",
            timestamp: new Date().toISOString()
          }
        }))

        // Actually call the LLM for vehicle identification
        const identifiedVehicle = await identifyVehicle(image!)
        setSelectedVehicle(identifiedVehicle)
        
        // LLM details will be set by identifyVehicle function
        
        // Update phase data with real results
        setPhaseData(prevData => ({
          ...prevData,
          1: {
            status: "complete",
            confidence: 0.95,
            make: identifiedVehicle.make,
            model: identifiedVehicle.model,
            year: identifiedVehicle.year,
            timestamp: new Date().toISOString()
          }
        }))
      } catch (error) {
        console.error('💥 Frontend: Error in vehicle identification:', error)
        // Handle error case
        const fallbackVehicle = vehicles[0]
        setSelectedVehicle(fallbackVehicle)
        setPhaseData(prevData => ({
          ...prevData,
          1: {
            status: "error",
            ...fallbackVehicle,
            timestamp: new Date().toISOString()
          }
        }))
      }
    } else if (newPhase === 2) {
      try {
        setPhaseData(prevData => ({
          ...prevData,
          2: {
            status: "processing",
            timestamp: new Date().toISOString()
          }
        }))

        const damagedParts = await analyzeDamage(image!)
        
        // Filter repair items based on the LLM's analysis
        const relevantRepairItems = allRepairItems.filter(item => 
          damagedParts.some((part: string) => 
            item.part.toLowerCase().includes(part.toLowerCase())
          )
        )

        // If no exact matches, use some default items
        const selectedItems = relevantRepairItems.length > 0 
          ? relevantRepairItems 
          : allRepairItems.slice(0, 3)

        setRepairItems(selectedItems)

        setPhaseData(prevData => ({
          ...prevData,
          2: {
            status: "complete",
            confidence: 0.9,
            damagedParts,
            timestamp: new Date().toISOString()
          }
        }))
      } catch (error) {
        console.error('💥 Frontend: Error in damage analysis:', error)
        // Handle error case
      }
    } else if (newPhase === 3) {
      try {
        setPhaseData(prevData => ({
          ...prevData,
          3: {
            status: "processing",
            timestamp: new Date().toISOString()
          }
        }))

        // Get the damaged parts from the previous phase
        const damagedParts = phaseData[2]?.damagedParts || []
        
        // Get pricing for the parts
        const pricedParts = await priceParts(damagedParts)
        
        // Update repair items with the LLM-generated prices
        setRepairItems(pricedParts)

        setPhaseData(prevData => ({
          ...prevData,
          3: {
            status: "complete",
            confidence: 0.9,
            pricedParts,
            timestamp: new Date().toISOString()
          }
        }))
      } catch (error) {
        console.error('💥 Frontend: Error in parts pricing:', error)
        // Handle error case
      }
    } else if (newPhase === 4) { // Estimating Labor phase
      try {
        setPhaseData(prevData => ({
          ...prevData,
          4: {
            status: "processing",
            timestamp: new Date().toISOString()
          }
        }))

        const laborEstimate = await estimateLabor(repairItems)
        
        setPhaseData(prevData => ({
          ...prevData,
          4: {
            status: "complete",
            confidence: 0.9,
            laborHours: laborEstimate.totalHours,
            laborRate: laborEstimate.hourlyRate,
            laborCost: laborEstimate.totalLaborCost,
            estimatedDuration: `${laborEstimate.estimatedDays} days`,
            details: laborEstimate.details,
            timestamp: new Date().toISOString()
          }
        }))
      } catch (error) {
        console.error('💥 Frontend: Error in labor estimation:', error)
        // Handle error case
      }
    } else {
      // For other phases, clear LLM details since they don't use the LLM
      setLLMDetails(null)
      // Generate and set mock data for other phases
      setPhaseData(prevData => ({
        ...prevData,
        [newPhase]: generatePhaseData(newPhase)
      }))
    }
    
    setTimeout(() => {
      setCanProgress(true)
    }, 1500)
  }

  const generatePhaseData = (phase: number) => {
    switch (phase) {
      case 0:
        return {
          confidence: 0.95,
          make: selectedVehicle?.make,
          model: selectedVehicle?.model,
          year: selectedVehicle?.year,
          timestamp: new Date().toISOString()
        }
      case 1:
        return {
          damageTypes: ["scratch", "dent", "crumple"],
          severity: "moderate",
          affectedAreas: ["front_bumper", "hood"],
          confidence: 0.88
        }
      case 2:
        return {
          partsRequired: repairItems.map(item => ({
            name: item.part,
            condition: "damaged",
            replacementOptions: {
              oem: { price: item.cost * 1.2, availability: "in_stock" },
              aftermarket: { price: item.cost, availability: "in_stock" }
            }
          }))
        }
      case 3:
        return {
          laborHours: repairItems.length * 2.5,
          laborRate: 85,
          estimatedDuration: "3 days",
          specialistRequired: false
        }
      case 4:
        return {
          claimNumber,
          totalParts: repairItems.length,
          totalCost,
          laborCost: repairItems.length * 2.5 * 85,
          partsCost: totalCost - (repairItems.length * 2.5 * 85),
          estimatedCompletion: "3-5 business days"
        }
      default:
        return {}
    }
  }

  // Add this function to handle retrying the damage check
  const handleRetryDamageCheck = async () => {
    if (!image) return;
    
    setCanProgress(false) // Disable progress while retrying
    
    // Reset phase data and progress
    setPhaseData(prevData => ({
      ...prevData,
      0: {
        status: "processing",
        timestamp: new Date().toISOString(),
        imageSize: image.size,
        imageType: image.type,
        processingStart: Date.now()
      }
    }))
    
    try {
      console.log('🔄 Frontend: Retrying damage check')
      const damageCheck = await checkDamage(image)
      
      setPhaseData(prevData => ({
        ...prevData,
        0: {
          hasDamage: damageCheck.hasDamage,
          confidence: 0.95,
          processingTime: Date.now() - prevData[0]?.processingStart,
          timestamp: new Date().toISOString(),
          status: "complete"
        }
      }))
      
      // Always enable progress in demo mode after retry
      if (isDemoMode) {
        setCanProgress(true)
      }
    } catch (error) {
      console.error('💥 Frontend: Error in retry:', error)
      setCanProgress(true) // Enable progress even on error
    }
  }

  // Add the analyzeDamage function
  const analyzeDamage = async (file: File) => {
    console.log('🚀 Frontend: Starting damage analysis', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    const formData = new FormData()
    formData.append('image', file)

    try {
      console.log('📤 Frontend: Sending image to damage analysis API')
      const response = await fetch('/api/analyze-damage', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      console.log('📥 Frontend: Damage analysis response:', data)

      // Set LLM details when we get the response
      setLLMDetails({
        model: "LLaVA 7B",
        prompt: "List only the damaged parts of this vehicle. Return only a comma-separated list of the damaged parts. For example: front bumper, hood, left fender. Be specific and only list parts that show visible damage.",
        response: data.rawResponse
      })

      return data.damagedParts
    } catch (error) {
      console.error('💥 Frontend: Error in damage analysis:', error)
      return ['front bumper', 'hood'] // Fallback on error
    }
  }

  // Add the priceParts function
  const priceParts = async (parts: string[]) => {
    console.log('🚀 Frontend: Starting parts pricing', { parts })

    const normalizePart = (part: string) => {
      return part
        .replace(/^:+/, '')  // Remove any leading colons
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim()
    }

    const normalizeDamage = (damage: string) => {
      return damage
        .split('.')
        .map(d => d.trim())
        .filter(d => d.length > 0)[0]
        .replace(/\s+/g, ' ')
        .trim()
    }

    try {
      console.log('📤 Frontend: Sending parts list to pricing API')
      const response = await fetch('/api/price-parts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parts })
      })

      const data = await response.json()
      console.log('📥 Frontend: Parts pricing response:', data)

      // Set LLM details when we get the response
      setLLMDetails({
        model: data.model || "LLaVA 7B",
        prompt: "Generate repair costs and details for damaged parts...",
        response: data.rawResponse
      })

      // Normalize the data before returning
      return data.pricedParts.map(item => ({
        part: normalizePart(item.part),
        damage: normalizeDamage(item.damage),
        repair: item.repair,
        cost: item.cost
      }))
    } catch (error) {
      console.error('💥 Frontend: Error in parts pricing:', error)
      return parts.map(part => ({
        part: normalizePart(part),
        cost: Math.floor(Math.random() * 1800) + 200,
        repair: "Replace and paint",
        damage: "Visible damage"
      }))
    }
  }

  // Update the estimateLabor function
  const estimateLabor = async (repairItems: typeof allRepairItems) => {
    console.log('Frontend: Starting labor estimation', { repairItems })

    try {
      console.log('📤 Frontend: Sending repair items to labor estimation API')
      const response = await fetch('/api/estimate-labor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repairItems })
      })

      const data = await response.json()
      console.log('📥 Frontend: Labor estimation response:', data)

      // Set LLM details when we get the response
      setLLMDetails({
        model: data.model || "LLaVA 7B", // Use the model from the response
        prompt: "Analyze repair items and estimate required labor...",
        response: data.rawResponse
      })

      return data.laborEstimate
    } catch (error) {
      console.error('💥 Frontend: Error in labor estimation:', error)
      // Fallback calculation
      const totalHours = repairItems.length * 2.5
      return {
        totalHours,
        hourlyRate: 95,
        totalLaborCost: totalHours * 95,
        estimatedDays: Math.ceil(totalHours / 8),
        details: "Standard labor estimate based on number of repairs"
      }
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-[#0c322c] text-white">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex-1">
            <Image
              src="/suse-white-logo-green.svg"
              alt="SUSE Logo"
              width={120}
              height={36}
              priority
            />
          </div>
          <div className="flex-1 text-center">
            <span className="text-2xl font-bold font-['SUSE']">Geeko Insurance</span>
          </div>
          <div className="flex-1 flex justify-end gap-3">
            <Button 
              onClick={() => router.push('/images')}
              className="bg-[#fe7c3f] hover:bg-[#e56e38]"
            >
              Images
            </Button>
            <Button 
              onClick={logout}
              className="bg-[#30ba78] hover:bg-[#2da86c]"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-grow bg-[#f4f4f4]">
        <div className="max-w-screen-xl mx-auto px-4 py-8">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold mb-8 text-center text-[#0c322c]"
          >
            Body Damage Assessment & Estimate
          </motion.h2>
          
          <div className="max-w-4xl mx-auto space-y-8">
            {!isProcessing && !showQuote && phaseData[0]?.hasDamage === false && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white shadow-xl border-t-4 border-t-[#30ba78]">
                  <CardHeader>
                    <CardTitle className="text-[#0c322c] text-2xl">No Damage Detected</CardTitle>
                    <CardDescription>
                      Our AI analysis did not detect any significant damage in the provided image.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      If you believe this is incorrect, you can:
                    </p>
                    <ul className="list-disc list-inside mt-2 text-gray-600">
                      <li>Try uploading a different photo</li>
                      <li>Take a photo from a different angle</li>
                      <li>Ensure the damage is clearly visible in the image</li>
                    </ul>
                  </CardContent>
                  <CardFooter className="flex gap-3">
                    <Button 
                      onClick={handleNewClaim}
                      className="bg-[#30ba78] hover:bg-[#2da86c] text-white"
                    >
                      Upload New Photo
                    </Button>
                    {isDemoMode && (
                      <Button 
                        onClick={handleRetryDamageCheck}
                        className="bg-[#fe7c3f] hover:bg-[#e56e38] text-white"
                      >
                        Retry Analysis
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {!isProcessing && !showQuote && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white shadow-xl border-t-4 border-t-[#30ba78]">
                  <CardHeader>
                    <CardTitle className="text-[#0c322c] text-2xl">Upload Photo</CardTitle>
                    <CardDescription>
                      Take or upload a clear photo of the vehicle damage
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 relative">
                        {imagePreview ? (
                          <div className="w-full relative">
                            <div className="relative w-full h-[300px] rounded-lg overflow-hidden">
                              <Image
                                src={imagePreview}
                                alt="Damage preview"
                                fill
                                className="object-contain"
                                sizes="(max-width: 768px) 100vw, 700px"
                              />
                            </div>
                            <div className="absolute top-2 right-2 flex gap-2">
                              <Button
                                onClick={() => {
                                  setImage(null)
                                  setImagePreview(null)
                                }}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Remove
                              </Button>
                            </div>
                            <div className="mt-4 flex justify-center gap-3">
                              <Button
                                onClick={startProcessing}
                                className="bg-[#30ba78] hover:bg-[#2da86c] text-white"
                              >
                                Submit Photo
                              </Button>
                            </div>
                            <div className="mt-4 flex justify-center">
                              <label className="flex items-center space-x-2 text-sm text-[#0c322c]">
                                <input
                                  type="checkbox"
                                  checked={isDemoMode}
                                  onChange={(e) => setIsDemoMode(e.target.checked)}
                                  className="rounded border-gray-300 text-[#30ba78] focus:ring-[#30ba78]"
                                />
                                <span>Demo Mode (Step-by-Step)</span>
                              </label>
                            </div>
                          </div>
                        ) : (
                          <Label
                            htmlFor="image-upload"
                            className="flex flex-col items-center justify-center w-full h-64 border-2 border-[#30ba78] border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-[#30ba78]" />
                              <p className="mb-2 text-sm text-[#0c322c]">
                                <span className="font-semibold">Upload a photo</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">JPEG or GIF only (MAX. 10MB)</p>
                            </div>
                            <Input
                              id="image-upload"
                              type="file"
                              className="hidden"
                              onChange={handleImageUpload}
                              accept="image/jpeg,image/gif"
                            />
                          </Label>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <p className="text-[#0c322c]">{image ? `File uploaded: ${image.name}` : 'No photo uploaded yet'}</p>
                  </CardFooter>
                </Card>
              </motion.div>
            )}

            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="bg-white shadow-xl border-t-4 border-t-[#30ba78]">
                  <CardHeader>
                    <CardTitle className="text-[#0c322c] text-2xl">Processing Your Claim</CardTitle>
                    {isDemoMode && (
                      <CardDescription>Demo Mode: Click Next to progress through each phase</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex justify-between">
                        {phases.map((phase, index) => (
                          <div key={index} className="flex flex-col items-center w-32">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${index <= currentPhase ? 'bg-[#30ba78] text-white' : 'bg-gray-200 text-gray-500'}`}>
                              {index < currentPhase ? <CheckCircle className="w-5 h-5" /> : index + 1}
                            </div>
                            <span className="text-xs mt-1 text-center">{phase.title}</span>
                          </div>
                        ))}
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full">
                        <div 
                          className="bg-[#30ba78] h-2 rounded-full transition-all duration-500 ease-in-out" 
                          style={{ 
                            width: `${
                              currentPhase === phases.length - 1 
                                ? '100' // Final phase
                                : currentPhase === 0 
                                  ? Math.min(identificationProgress, 16.67) // First phase (1/6 of total)
                                  : ((currentPhase) * 16.67) + 16.67 // Each phase gets equal portion (100% / 6 phases)
                            }%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-center mt-6">
                        <motion.p
                          key={currentPhase}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="text-sm text-gray-600 italic"
                        >
                          {currentPhase === 0 
                            ? phases[0].completeDescription(phaseData[0]?.hasDamage ?? null)
                            : currentPhase === 1
                              ? phases[1].completeDescription(selectedVehicle)
                              : isDemoMode 
                                ? phases[currentPhase]?.demoDescription 
                                : phases[currentPhase]?.description ?? "Processing..."}
                        </motion.p>
                        
                        {isDemoMode && llmDetails && (
                          <div className="mt-6 text-left">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-[#0c322c] flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  AI Model Details
                                </h4>
                                <div className="pl-4 space-y-1">
                                  <p className="text-sm text-gray-600">
                                    Using <span className="font-mono text-[#30ba78]">{llmDetails.model}</span>
                                  </p>
                                  {apiConfig && (
                                    <p className="text-sm text-gray-600">
                                      API: <span className="font-mono text-[#30ba78]">{apiConfig.ollamaApiUrl}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-[#0c322c] flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                  Prompt
                                </h4>
                                <div className="pl-4">
                                  <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                                    "{llmDetails.prompt}"
                                  </p>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-[#0c322c] flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                  Response
                                </h4>
                                <div className="pl-4">
                                  <p className="text-sm text-gray-600 font-mono bg-gray-100 p-2 rounded">
                                    "{llmDetails.response}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {isDemoMode && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-4 flex justify-center gap-3"
                          >
                            <Button
                              onClick={handleNextPhase}
                              disabled={!canProgress}
                              className="bg-[#30ba78] hover:bg-[#2da86c] text-white"
                            >
                              {currentPhase === phases.length - 1 ? 'Complete' : 'Next Phase'}
                            </Button>
                            
                            <Button 
                              onClick={async () => {
                                setCanProgress(false)
                                if (currentPhase === 0) {
                                  await handleRetryDamageCheck()
                                } else if (currentPhase === 1) {
                                  // Reset and retry vehicle identification
                                  const identifiedVehicle = await identifyVehicle(image!)
                                  setSelectedVehicle(identifiedVehicle)
                                  setPhaseData(prevData => ({
                                    ...prevData,
                                    1: {
                                      status: "complete",
                                      confidence: 0.95,
                                      make: identifiedVehicle.make,
                                      model: identifiedVehicle.model,
                                      year: identifiedVehicle.year,
                                      timestamp: new Date().toISOString()
                                    }
                                  }))
                                  setCanProgress(true)
                                }
                              }}
                              disabled={!image || currentPhase > 1}
                              className="bg-[#fe7c3f] hover:bg-[#e56e38] text-white"
                            >
                              Retry {currentPhase === 0 ? 'Damage Check' : currentPhase === 1 ? 'Vehicle ID' : ''}
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {showQuote && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <Card className="bg-white shadow-xl border-t-4 border-t-[#30ba78]">
                    <CardHeader>
                      <CardTitle className="text-[#0c322c] text-2xl">Body Damage Repair Quote</CardTitle>
                      <CardDescription>
                        Geeko Insurance Claim #{claimNumber}
                      </CardDescription>
                      {selectedVehicle && (
                        <div className="mt-2 font-medium text-[#0c322c]">
                          Vehicle: {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-b border-gray-200">
                            <TableHead className="text-[#0c322c]">Damaged Part</TableHead>
                            <TableHead className="text-[#0c322c]">Damage Description</TableHead>
                            <TableHead className="text-[#0c322c]">Repair Method</TableHead>
                            <TableHead className="text-right text-[#0c322c]">Estimated Cost</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {repairItems.map((item, index) => (
                            <TableRow key={index} className="border-b border-gray-200">
                              <TableCell className="font-medium text-[#0c322c]">{item.part}</TableCell>
                              <TableCell>{item.damage}</TableCell>
                              <TableCell>{item.repair}</TableCell>
                              <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                    <CardFooter className="flex justify-between items-center">
                      <span className="text-lg font-bold text-[#0c322c]">Total Estimated Cost:</span>
                      <span className="text-lg font-bold text-[#30ba78]">${totalCost.toFixed(2)}</span>
                    </CardFooter>
                    <CardFooter className="justify-end pt-0">
                      <PDFDownloadLink
                        document={
                          <QuotePDF 
                            repairItems={repairItems} 
                            totalCost={totalCost} 
                            vehicle={selectedVehicle || undefined}
                            claimNumber={claimNumber}
                          />
                        }
                        fileName={`geeko-insurance-quote-${Date.now()}.pdf`}
                      >
                        {({ loading }) => (
                          <Button 
                            className="bg-[#fe7c3f] hover:bg-[#e56e38] text-white"
                            disabled={loading}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            {loading ? 'Preparing PDF...' : 'Download PDF'}
                          </Button>
                        )}
                      </PDFDownloadLink>
                    </CardFooter>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="flex justify-center"
                >
                  <Button 
                    onClick={handleNewClaim}
                    className="bg-[#30ba78] hover:bg-[#2da86c] text-white px-8"
                  >
                    New Claim
                  </Button>
                </motion.div>
              </>
            )}

            {isProcessing && phaseData[0]?.status === "error" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-white shadow-xl border-t-4 border-t-red-500">
                  <CardHeader>
                    <CardTitle className="text-red-500 text-2xl">Processing Error</CardTitle>
                    <CardDescription>
                      {phaseData[0].error || "An error occurred during processing"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">
                      Please try again with a different photo or try again later.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={handleNewClaim}
                      className="bg-[#30ba78] hover:bg-[#2da86c] text-white"
                    >
                      Start Over
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      <footer className="bg-[#0c322c] text-white py-4">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="text-sm">&copy; 2024 Geeko Insurance, A Damage Inc Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}