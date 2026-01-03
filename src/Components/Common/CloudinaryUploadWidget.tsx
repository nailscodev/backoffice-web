import React, { useEffect, useRef } from 'react';
import { Button } from 'reactstrap';

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string) => void;
  currentImage?: string;
  folder?: string;
}

declare global {
  interface Window {
    cloudinary: any;
  }
}

const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({
  onUploadSuccess,
  currentImage,
  folder = 'nailsco/categories',
}) => {
  const cloudinaryRef = useRef<any>();
  const widgetRef = useRef<any>();

  useEffect(() => {
    // Load Cloudinary widget script
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://upload-widget.cloudinary.com/global/all.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        cloudinaryRef.current = window.cloudinary;
      };
    } else {
      cloudinaryRef.current = window.cloudinary;
    }
  }, []);

  const openWidget = () => {
    if (!cloudinaryRef.current) {
      console.error('Cloudinary not loaded yet');
      return;
    }

    widgetRef.current = cloudinaryRef.current.createUploadWidget(
      {
        cloudName: 'djukq9se3',
        uploadPreset: 'nailsco_categories', // Cambia esto al nombre que usaste en Cloudinary
        folder: folder,
        sources: ['local', 'url', 'camera'],
        multiple: false,
        maxFiles: 1,
        maxFileSize: 5000000, // 5MB
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        showSkipCropButton: false,
        styles: {
          palette: {
            window: '#FFFFFF',
            windowBorder: '#90A0B3',
            tabIcon: '#0078FF',
            menuIcons: '#5A616A',
            textDark: '#000000',
            textLight: '#FFFFFF',
            link: '#0078FF',
            action: '#FF620C',
            inactiveTabIcon: '#0E2F5A',
            error: '#F44235',
            inProgress: '#0078FF',
            complete: '#20B832',
            sourceBg: '#E4EBF1',
          },
        },
      },
      (error: any, result: any) => {
        console.log('Cloudinary event:', result?.event);
        console.log('Cloudinary result:', result);
        
        if (!error && result && result.event === 'success') {
          console.log('Upload successful:', result.info);
          console.log('Secure URL:', result.info.secure_url);
          onUploadSuccess(result.info.secure_url);
        }
        if (error) {
          console.error('Upload error:', error);
        }
      }
    );

    widgetRef.current.open();
  };

  return (
    <div className="cloudinary-upload-widget">
      {currentImage && (
        <div className="mb-3 text-center">
          <img
            src={currentImage}
            alt="Current"
            className="img-thumbnail"
            style={{ maxHeight: '200px', objectFit: 'contain' }}
          />
        </div>
      )}
      <Button color="primary" outline onClick={openWidget} type="button">
        <i className="ri-upload-cloud-line me-1"></i>
        {currentImage ? 'Change Image' : 'Upload Image'}
      </Button>
      <p className="text-muted small mt-2 mb-0">
        Recommended: Square image, max 5MB (JPG, PNG, GIF, WebP)
      </p>
    </div>
  );
};

export default CloudinaryUploadWidget;
