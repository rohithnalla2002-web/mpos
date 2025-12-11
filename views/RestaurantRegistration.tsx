import React, { useState } from 'react';
import { Button, Card, LoadingSpinner } from '../components/ui';
import { API } from '../services/api';
import { 
  Building2, MapPin, Phone, Mail, Utensils, Clock, Users, 
  Upload, FileText, Shield, CheckCircle2, X, ArrowLeft, ArrowRight,
  Image as ImageIcon, FileCheck, Award, Globe, Lock
} from 'lucide-react';

interface RestaurantRegistrationProps {
  onBack: () => void;
  onSubmit: (data: RestaurantFormData) => void;
}

export interface RestaurantFormData {
  // Basic Info
  restaurantName: string;
  ownerName: string;
  email: string;
  password: string;
  phone: string;
  cuisineType: string;
  
  // Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Business Details
  businessType: string;
  taxId: string;
  numberOfTables: string;
  operatingHours: string;
  description: string;
  
  // Documents
  businessLicense: File | null;
  taxDocument: File | null;
  healthPermit: File | null;
  ownerIdProof: File | null;
  restaurantPhoto: File | null;
}

export const RestaurantRegistration: React.FC<RestaurantRegistrationProps> = ({ onBack, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState<RestaurantFormData>({
    restaurantName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
    cuisineType: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    businessType: '',
    taxId: '',
    numberOfTables: '',
    operatingHours: '',
    description: '',
    businessLicense: null,
    taxDocument: null,
    healthPermit: null,
    ownerIdProof: null,
    restaurantPhoto: null,
  });

  const [filePreviews, setFilePreviews] = useState<{ [key: string]: string }>({});

  const steps = [
    { number: 1, title: 'Basic Information', icon: Building2 },
    { number: 2, title: 'Location Details', icon: MapPin },
    { number: 3, title: 'Business Details', icon: FileText },
    { number: 4, title: 'Documents', icon: Shield },
  ];

  const handleInputChange = (field: keyof RestaurantFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (field: keyof RestaurantFormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (step === 1) {
      if (!formData.restaurantName) newErrors.restaurantName = 'Restaurant name is required';
      if (!formData.ownerName) newErrors.ownerName = 'Owner name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password && formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (!formData.cuisineType) newErrors.cuisineType = 'Cuisine type is required';
    } else if (step === 2) {
      if (!formData.streetAddress) newErrors.streetAddress = 'Street address is required';
      if (!formData.city) newErrors.city = 'City is required';
      if (!formData.state) newErrors.state = 'State is required';
      if (!formData.zipCode) newErrors.zipCode = 'Zip code is required';
    } else if (step === 3) {
      if (!formData.businessType) newErrors.businessType = 'Business type is required';
      if (!formData.taxId) newErrors.taxId = 'Tax ID is required';
      if (!formData.numberOfTables) newErrors.numberOfTables = 'Number of tables is required';
    } else if (step === 4) {
      if (!formData.businessLicense) newErrors.businessLicense = 'Business license is required';
      if (!formData.taxDocument) newErrors.taxDocument = 'Tax document is required';
      if (!formData.healthPermit) newErrors.healthPermit = 'Health permit is required';
      if (!formData.ownerIdProof) newErrors.ownerIdProof = 'Owner ID proof is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;
    
    setLoading(true);
    setErrors({});

    try {
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      
      // Add text fields
      formDataToSend.append('restaurantName', formData.restaurantName);
      formDataToSend.append('ownerName', formData.ownerName);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('cuisineType', formData.cuisineType);
      formDataToSend.append('streetAddress', formData.streetAddress);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('zipCode', formData.zipCode);
      formDataToSend.append('country', formData.country);
      formDataToSend.append('businessType', formData.businessType);
      formDataToSend.append('taxId', formData.taxId);
      formDataToSend.append('numberOfTables', formData.numberOfTables);
      formDataToSend.append('operatingHours', formData.operatingHours || '');
      formDataToSend.append('description', formData.description || '');

      // Add files
      if (formData.businessLicense) {
        formDataToSend.append('businessLicense', formData.businessLicense);
      }
      if (formData.taxDocument) {
        formDataToSend.append('taxDocument', formData.taxDocument);
      }
      if (formData.healthPermit) {
        formDataToSend.append('healthPermit', formData.healthPermit);
      }
      if (formData.ownerIdProof) {
        formDataToSend.append('ownerIdProof', formData.ownerIdProof);
      }
      if (formData.restaurantPhoto) {
        formDataToSend.append('restaurantPhoto', formData.restaurantPhoto);
      }

      // Call API
      const result = await API.registerRestaurant(formDataToSend);
      
      // Show success message
      alert(result.message || 'Restaurant registration submitted successfully!');
      
      // Call onSubmit callback to navigate
      onSubmit(formData);
    } catch (error: any) {
      console.error('Registration error:', error);
      setErrors({ submit: error.message || 'Failed to submit registration. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const FileUploadField = ({ 
    label, 
    field, 
    accept, 
    required = false,
    description 
  }: { 
    label: string; 
    field: keyof RestaurantFormData; 
    accept?: string;
    required?: boolean;
    description?: string;
  }) => {
    const file = formData[field] as File | null;
    const preview = filePreviews[field];

    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {description && (
          <p className="text-xs text-slate-500 mb-2">{description}</p>
        )}
        <div className="relative">
          <input
            type="file"
            accept={accept}
            onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
            className="hidden"
            id={field}
          />
          <label
            htmlFor={field}
            className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
              file 
                ? 'border-emerald-500 bg-emerald-50' 
                : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
            } ${errors[field] ? 'border-rose-500' : ''}`}
          >
            {file ? (
              <>
                <div className="p-2 bg-emerald-500 rounded-lg">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileChange(field, null);
                  }}
                  className="p-1.5 hover:bg-rose-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-rose-600" />
                </button>
              </>
            ) : (
              <>
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Upload className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">Click to upload</p>
                  <p className="text-xs text-slate-500">PDF, JPG, PNG (Max 5MB)</p>
                </div>
              </>
            )}
          </label>
        </div>
        {errors[field] && (
          <p className="text-xs text-rose-600 mt-1">{errors[field]}</p>
        )}
        {preview && file?.type.startsWith('image/') && (
          <div className="mt-3 rounded-lg overflow-hidden border border-slate-200">
            <img src={preview} alt="Preview" className="w-full h-32 object-cover" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 sm:mb-6 transition-colors touch-manipulation active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">Back to Home</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-2 tracking-tight">Restaurant Registration</h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium">Join DineFlow and transform your restaurant operations</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center flex-1 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all flex-shrink-0 ${
                      currentStep > step.number
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : currentStep === step.number
                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <step.icon className="w-6 h-6" />
                      )}
                    </div>
                    <p className={`text-[10px] sm:text-xs font-semibold mt-2 text-center truncate w-full ${
                      currentStep >= step.number ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${
                    currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="p-4 sm:p-6 md:p-8 border-0 shadow-xl">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Basic Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Restaurant Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.restaurantName}
                      onChange={(e) => handleInputChange('restaurantName', e.target.value)}
                      className={`w-full border-2 rounded-xl p-3 sm:p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-base sm:text-sm ${
                        errors.restaurantName ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="e.g. The Golden Fork"
                    />
                    {errors.restaurantName && (
                      <p className="text-xs text-rose-600 mt-1">{errors.restaurantName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Owner Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      className={`w-full border-2 rounded-xl p-3 sm:p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-base sm:text-sm ${
                        errors.ownerName ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="John Doe"
                    />
                    {errors.ownerName && (
                      <p className="text-xs text-rose-600 mt-1">{errors.ownerName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium ${
                          errors.email ? 'border-rose-500' : 'border-slate-300'
                        }`}
                        placeholder="restaurant@example.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-rose-600 mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Password <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium ${
                          errors.password ? 'border-rose-500' : 'border-slate-300'
                        }`}
                        placeholder="Enter your password"
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs text-rose-600 mt-1">{errors.password}</p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium ${
                          errors.phone ? 'border-rose-500' : 'border-slate-300'
                        }`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-xs text-rose-600 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Cuisine Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Utensils className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        value={formData.cuisineType}
                        onChange={(e) => handleInputChange('cuisineType', e.target.value)}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium bg-white ${
                          errors.cuisineType ? 'border-rose-500' : 'border-slate-300'
                        }`}
                      >
                        <option value="">Select cuisine type</option>
                        <option value="Italian">Italian</option>
                        <option value="Chinese">Chinese</option>
                        <option value="Indian">Indian</option>
                        <option value="Mexican">Mexican</option>
                        <option value="American">American</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Thai">Thai</option>
                        <option value="French">French</option>
                        <option value="Mediterranean">Mediterranean</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {errors.cuisineType && (
                      <p className="text-xs text-rose-600 mt-1">{errors.cuisineType}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Location Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Location Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Street Address <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.streetAddress}
                        onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium ${
                          errors.streetAddress ? 'border-rose-500' : 'border-slate-300'
                        }`}
                        placeholder="123 Main Street"
                      />
                    </div>
                    {errors.streetAddress && (
                      <p className="text-xs text-rose-600 mt-1">{errors.streetAddress}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      City <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full border-2 rounded-xl p-3 sm:p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-base sm:text-sm ${
                        errors.city ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="New York"
                    />
                    {errors.city && (
                      <p className="text-xs text-rose-600 mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      State <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={`w-full border-2 rounded-xl p-3 sm:p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-base sm:text-sm ${
                        errors.state ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="NY"
                    />
                    {errors.state && (
                      <p className="text-xs text-rose-600 mt-1">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Zip Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.zipCode}
                      onChange={(e) => handleInputChange('zipCode', e.target.value)}
                      className={`w-full border-2 rounded-xl p-3 sm:p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-base sm:text-sm ${
                        errors.zipCode ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="10001"
                    />
                    {errors.zipCode && (
                      <p className="text-xs text-rose-600 mt-1">{errors.zipCode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Country <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full border-2 border-slate-300 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium bg-white"
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="India">India</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Business Details */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <FileText className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Business Details</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Business Type <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className={`w-full border-2 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium bg-white ${
                        errors.businessType ? 'border-rose-500' : 'border-slate-300'
                      }`}
                    >
                      <option value="">Select business type</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Partnership">Partnership</option>
                      <option value="LLC">LLC</option>
                      <option value="Corporation">Corporation</option>
                    </select>
                    {errors.businessType && (
                      <p className="text-xs text-rose-600 mt-1">{errors.businessType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Tax ID / EIN <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      className={`w-full border-2 rounded-xl p-3 sm:p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-base sm:text-sm ${
                        errors.taxId ? 'border-rose-500' : 'border-slate-300'
                      }`}
                      placeholder="12-3456789"
                    />
                    {errors.taxId && (
                      <p className="text-xs text-rose-600 mt-1">{errors.taxId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Number of Tables <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="number"
                        value={formData.numberOfTables}
                        onChange={(e) => handleInputChange('numberOfTables', e.target.value)}
                        className={`w-full border-2 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium ${
                          errors.numberOfTables ? 'border-rose-500' : 'border-slate-300'
                        }`}
                        placeholder="20"
                        min="1"
                      />
                    </div>
                    {errors.numberOfTables && (
                      <p className="text-xs text-rose-600 mt-1">{errors.numberOfTables}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Operating Hours
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={formData.operatingHours}
                        onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                        className="w-full border-2 border-slate-300 rounded-xl pl-12 pr-4 py-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="Mon-Sun: 11:00 AM - 10:00 PM"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Restaurant Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full border-2 border-slate-300 rounded-xl p-3.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium resize-none"
                      placeholder="Tell us about your restaurant, specialties, ambiance..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <Shield className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">Verification Documents</h2>
                </div>
                <p className="text-sm text-slate-600 mb-6">
                  Please upload the following documents to verify your restaurant. All documents will be securely stored and reviewed by our team.
                </p>

                {errors.submit && (
                  <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                    <p className="text-sm text-rose-600 font-semibold">{errors.submit}</p>
                  </div>
                )}

                <div className="space-y-6">
                  <FileUploadField
                    label="Business License"
                    field="businessLicense"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    description="Upload your valid business license document"
                  />

                  <FileUploadField
                    label="Tax Document"
                    field="taxDocument"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    description="Tax identification or EIN document"
                  />

                  <FileUploadField
                    label="Health Permit"
                    field="healthPermit"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    description="Current health department permit"
                  />

                  <FileUploadField
                    label="Owner ID Proof"
                    field="ownerIdProof"
                    accept=".pdf,.jpg,.jpeg,.png"
                    required
                    description="Government-issued ID (Driver's License, Passport, etc.)"
                  />

                  <FileUploadField
                    label="Restaurant Photo"
                    field="restaurantPhoto"
                    accept=".jpg,.jpeg,.png"
                    description="Exterior or interior photo of your restaurant (Optional)"
                  />
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={currentStep === 1 ? onBack : handlePrevious}
                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors touch-manipulation active:scale-95 order-2 sm:order-1 w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                {currentStep === 1 ? 'Back' : 'Previous'}
              </button>

              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20 touch-manipulation active:scale-95 order-1 sm:order-2 w-full sm:w-auto"
                >
                  Next Step <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading}
                  className="px-6 sm:px-8 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20 touch-manipulation active:scale-95 w-full sm:w-auto"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner /> Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

