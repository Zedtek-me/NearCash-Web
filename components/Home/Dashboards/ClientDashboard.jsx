import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowUpRight, ArrowUp, ArrowDown, Clock, MoreHorizontal, Eye, MapPin, ChevronDown,
  ChevronUp, X, Navigation, Loader2, ArrowLeft, ArrowRight, CircleSmall
 } from 'lucide-react';
import { Subscriber } from "../../../utils/subscriber";
import { useStateValue } from "../../../providers/stateProvider";
import Navbar from '../Navs/Headers';
import { VENDOR_LIST, GET_VENDOR_POLICIES, GET_ASSETS, GET_TRANSACTIONS } from '../../Auths/queries/userQueries';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { CREATE_TRANSACTION, RESPOND_TO_TRANSACTION } from '../../Auths/mutations/userMutations';
import { GET_ANALYTICS } from "./queries/analytics";
import useAuth from '../../../Hooks/Auths';
import TransactionCard from '../TransactionCard';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';
import EmptyTableState from '../components/EmptyTable';
import TransactionFilter from '../TransactionFilter';
import { useWebSocket } from '../../Notification/WebSocketProvider';
import TransactionStatusModal from '../components/TransactionStatusModal';

export default function ClientDashboard() {
  const [clientInfo, setClientInfo] = useState({});
  const { userData } = useAuth();
  const navigate = useNavigate();
  const { userType } = userData;


  const [expandedCards, setExpandedCards] = useState(new Set());
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapData, setMapData] = useState(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [amount, setAmount] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [assetId, setAssets] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [txStatusModal, setTxStatusModal] = useState({
  isOpen: false,
  status: "loading",        
  transactionInfo: {},
  delayActionLoading: null,
});
 
const [activeTxId, setActiveTxId] = useState(null);
  const socket = useWebSocket();


  const getStatusColor = (status) => {
    switch (status) {
      case 'Done': return 'bg-green-100 text-green-600';
      case 'Pending': return 'bg-yellow-100 text-yellow-600';
      case 'Failed': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const statusMap = [
    {
      name: "All", color: "black"
    },
    {
      name: "Initiated", color: "black"
    },
    {
      name: "Declined", color: "black"
    },
    {
      name: "Cancelled", color: "black"
    },
    {
      name: "In Progress", color: "black"
    },
    {
      name: "Fulfilled", color: "black"
    }
  ]

  const { data, loading, error } = useQuery(VENDOR_LIST, {
    variables: {
      currentLat: userLocation?.lat || 0,
      currentLong: userLocation?.lng || 0
    },
    skip: !userLocation
  });

  const [fetchPolicies, { data: policiesData, loading: policiesLoading }] =
    useLazyQuery(GET_VENDOR_POLICIES);

  const [createTransaction, { loading: creating }] = useMutation(CREATE_TRANSACTION);
  const [respondToTransaction, { loading: responding }] = useMutation(RESPOND_TO_TRANSACTION);

  const [fetchAsset, { data: assetData, loading: assetLoading }] =
    useLazyQuery(GET_ASSETS);

    const { data: transactionData, loading: transactionLoading, error: transactionError, refetch } = useQuery(GET_TRANSACTIONS, {
      variables: { pageCount: 10, pageNumber },
      fetchPolicy: "network-only",
    });

    const {
      data: analyticsData,
      error: analyticsError,
      loading: analyticsLoading,
      refetch: refectAnalytics
    } = useQuery(GET_ANALYTICS, {
      variables: {
        userType: userType?.toLowerCase()
      }
    })
  const handleNext = () => {
  setPageNumber((prev) => prev + 1);
};

const handlePrevious = () => {
  if (pageNumber > 1) setPageNumber((prev) => prev - 1);
};

useEffect(() => {
  console.log("Socket message received:", activeTxId, socket);
  
  if (!socket || !activeTxId) return;
 
  const onMessage = (event) => {
    let data;
    console.log(event.data);
    
    try { data = JSON.parse(event.data); } catch { return; }
 
    const { message_type, txn_info } = data;
 
    if (txn_info?.transaction_id && txn_info.transaction_id !== activeTxId) return;
 
    if (message_type === "Transaction Approved!") {
      setTxStatusModal((prev) => ({
        ...prev,
        status: "approved",
        transactionInfo: {
          ...prev.transactionInfo,
          transactionId: txn_info?.transaction_id,
          vendorName: txn_info?.vendor_name || prev.transactionInfo.vendorName,
          amount: txn_info?.amount || prev.transactionInfo.amount,
        },
      }));
      refetch();
    }
 
    if (message_type === "Transaction Declined!") {
      setTxStatusModal((prev) => ({ ...prev, status: "declined" }));
    }
 
    if (message_type === "Vendor Response Delayed") {
      setTxStatusModal((prev) => ({ ...prev, status: "delayed" }));
    }
    if (message_type === "No Available Vendors") {
      setTxStatusModal((prev) => ({ ...prev, status: "noVendors" }));
    }
  };
 
  socket.addEventListener("message", onMessage);
  return () => socket.removeEventListener("message", onMessage);
}, [socket, activeTxId]);



  useEffect(() => {
  const getLocation = (highAccuracy = false) => {
    let errorFound = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(location);
        localStorage.setItem("userLocation", JSON.stringify(location));
      },
      (err) => {
        const count = 1;
        errorFound = true;
        console.error("Location error:", err);
        if (err.code === 2) { // LOCATION_UNKNOWN
          setTimeout(getLocation, 2000); // retry after 2s with accuracy
        } else {
          alert("Could not get user current location.")
        }
      },
      { enableHighAccuracy: highAccuracy, timeout: 200000, maximumAge: 5000 }
    );
    return errorFound;
  };
  
  getLocation(false);
}, []);

    const [
            {
              auth,
            },
            dispatch
          ] = Object.values(useStateValue());
        let authTypeFromContext;
            Subscriber.subscribe('auth', (data) => {
        authTypeFromContext = data;
        });
        const socialTypeFromContext = localStorage.getItem("auth_type")

// Sample route data (your BE response format)
  const sampleRouteData = {
    routes: "{\"features\": [{\"type\": \"Feature\", \"properties\": {\"mode\": \"walk\", \"waypoints\": [{\"location\": [3.31658, 6.618034], \"original_index\": 0}, {\"location\": [3.31658, 6.618034], \"original_index\": 1}], \"units\": \"metric\", \"distance\": 0, \"distance_units\": \"meters\", \"time\": 0, \"legs\": [{\"distance\": 0, \"time\": 0, \"steps\": [{\"from_index\": 0, \"to_index\": 1, \"distance\": 0, \"time\": 0, \"instruction\": {\"text\": \"Walk north on Tijani Street.\"}}, {\"from_index\": 1, \"to_index\": 1, \"distance\": 0, \"time\": 0, \"instruction\": {\"text\": \"You have arrived at your destination.\"}}]}]}, \"geometry\": {\"type\": \"MultiLineString\", \"coordinates\": [[[3.31658, 6.618034], [3.31658, 6.618034]]]}}], \"properties\": {\"mode\": \"walk\", \"waypoints\": [{\"lat\": 6.618034317294, \"lon\": 3.316580112845776}, {\"lat\": 6.618034317294, \"lon\": 3.316580112845776}], \"units\": \"metric\"}, \"type\": \"FeatureCollection\"}"
  };

  // Check for stored location on component mount
  useEffect(() => {
    const storedLocation = JSON.parse(localStorage.getItem('userLocation') || null);
    if (storedLocation) {
      setUserLocation(storedLocation);
    }
  }, []);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css';
      document.head.appendChild(link);
    }
    // Add Leaflet JS
    if (!window.L && !document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js';
      script.onload = () => {
        console.log('Leaflet loaded successfully');
      };
      document.head.appendChild(script);
    }
  }, []);

  const getAvatarColor = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-orange-500',
      'bg-pink-500',
      'bg-indigo-500'
    ];
    return colors[index % colors.length];
  };

  const toggleExpanded = (storeId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(storeId)) {
      newExpanded.delete(storeId);
    } else {
      newExpanded.add(storeId);
    }
    setExpandedCards(newExpanded);
  };

  const requestLocationPermission = () => {
    setIsLoadingLocation(true);
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      setIsLoadingLocation(false);
      return;
    }

    const tryHighAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
          setShowLocationModal(false);
          setIsLoadingLocation(false);
          
          if (selectedStore) {
            fetchRouteData(location, selectedStore);
          }
        },
        (error) => {
          console.log('High accuracy failed, trying low accuracy...', error);
          tryLowAccuracy();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    };

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          localStorage.setItem('userLocation', JSON.stringify(location));
          setShowLocationModal(false);
          setIsLoadingLocation(false);
          
          if (selectedStore) {
            fetchRouteData(location, selectedStore);
          }
        },
        (error) => {
          // setIsLoadingLocation(false);
          // console.error('Geolocation error:', error);
          
          // // For demo purposes, use a default location (Lagos, Nigeria)
          // const defaultLocation = { lat: 6.5244, lng: 3.3792 };
          // setUserLocation(defaultLocation);
          // localStorage.setItem('userLocation', JSON.stringify(defaultLocation));
          // setShowLocationModal(false);
          
          // alert('Unable to get your exact location. Using default location (Lagos) for demo purposes.');
          
          // if (selectedStore) {
          //   fetchRouteData(defaultLocation, selectedStore);
          // }
        },
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000
        }
      );
    };

    tryHighAccuracy();
  };

  const fetchRouteData = async (userLoc, store) => {
    setIsLoadingRoute(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const parsedRoutes = JSON.parse(sampleRouteData.routes);
      setMapData(parsedRoutes);
      setShowMap(true);
      
      
    } catch (error) {
      console.error('Error fetching route data:', error);
      alert('Failed to load route data. Please try again.');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  const initializeMap = () => {
    if (!window.L || !mapRef.current || !mapData || !userLocation) return;

    // Clear existing map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    try {
      const waypoints = mapData.properties.waypoints;
      const coordinates = mapData.features[0].geometry.coordinates[0];
      
      // Create map centered on user location
      const map = window.L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 13);
      mapInstanceRef.current = map;

      // Add tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add user location marker
      const userIcon = window.L.divIcon({
        className: 'user-location-marker',
        html: '<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      window.L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('Your Location')
        .openPopup();

      // Add store location marker
      const storeIcon = window.L.divIcon({
        className: 'store-location-marker',
        html: '<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      
      window.L.marker([selectedStore.coordinates.lat, selectedStore.coordinates.lng], { icon: storeIcon })
        .addTo(map)
        .bindPopup(selectedStore.name);

      // Add route line if coordinates exist
      if (coordinates && coordinates.length > 0) {
        const routeCoordinates = coordinates.map(coord => [coord[1], coord[0]]); // Swap lng,lat to lat,lng
        
        const routeLine = window.L.polyline(routeCoordinates, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8
        }).addTo(map);

        // Fit map to show both markers and route
        const group = new window.L.featureGroup([
          window.L.marker([userLocation.lat, userLocation.lng]),
          window.L.marker([selectedStore.coordinates.lat, selectedStore.coordinates.lng]),
          routeLine
        ]);
        map.fitBounds(group.getBounds().pad(0.1));
      } else {
        // Fit map to show both markers
        const group = new window.L.featureGroup([
          window.L.marker([userLocation.lat, userLocation.lng]),
          window.L.marker([selectedStore.coordinates.lat, selectedStore.coordinates.lng])
        ]);
        map.fitBounds(group.getBounds().pad(0.1));
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Initialize map when data is ready
  useEffect(() => {
    if (showMap && mapData && userLocation && selectedStore) {
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showMap, mapData, userLocation, selectedStore]);

  const handleViewOnMap = (store) => {
    setSelectedStore(store);
    
    if (!userLocation) {
      setShowLocationModal(true);
    } else {
      fetchRouteData(userLocation, store);
    }
  };

  const closeMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    setShowMap(false);
    setMapData(null);
    setSelectedStore(null);
  };

  const LocationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Location Permission Required</h3>
          <button
            onClick={() => {
              setShowLocationModal(false);
              setSelectedStore(null);
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <Navigation className="text-blue-500 mr-3" size={24} />
            <span className="text-gray-700">Enable Location Access</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            This app needs access to your location to show you the best route to the vendors and provide accurate directions.
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              Your location data is only used to calculate routes and is stored locally on your device.
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setShowLocationModal(false);
              setSelectedStore(null);
            }}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={requestLocationPermission}
            disabled={isLoadingLocation}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isLoadingLocation ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Getting Location...
              </>
            ) : (
              'Allow Location'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const getRouteInstructions = () => {
    if (!mapData || !mapData.features || !mapData.features[0]) return [];
    
    const legs = mapData.features[0].properties.legs;
    if (!legs || !legs[0] || !legs[0].steps) return [];
    
    return legs[0].steps.map(step => step.instruction.text);
  };


  const handleInitiateTransaction = (vendor, assetId) => {
    setSelectedVendor(vendor);
    setAssets(assetId);
    console.log('assetId', assetId);
    
    setShowTransactionModal(true);
    fetchPolicies({ variables: { businessId: String(vendor.id) } });
  };

 const handleSubmitTransaction = async () => {
  if (!amount || !selectedPolicy) {
    toast.error("Please enter an amount and select a policy");
    return;
  }
 
  try {
    const variables = {
      transactionData: {
        assetId: assetId,
        vendorId: selectedVendor.id.toString(),
        amountToWithdraw: parseFloat(amount),
        clientCurrentCoordinates: {
          latitude: userLocation.lat,
          longitude: userLocation.lng,
        },
        collectionMode: policiesData?.businessTransactionPolicyForUser?.cashCollectionMode,
        collectionLocation: "",
      },
    };
 
    const result = await createTransaction({ variables });
    const txId = result?.data?.initiateTransaction?.transaction?.id;
 
    setShowTransactionModal(false);
    setAmount("");
    setSelectedPolicy(null);

    console.log(txId, result);
    
 
    setActiveTxId(txId);
    setTxStatusModal({
      isOpen: true,
      status: "loading",
      transactionInfo: {
        amount: parseFloat(amount),
        vendorName: selectedVendor?.name,
        transactionId: txId,
      },
      delayActionLoading: null,
    });
 
    refetch();
  } catch (err) {
    console.error(err);
    toast.error("Failed to create transaction");
  }
};

  const ViewAssets = (vendorId) => {
     toggleExpanded(vendorId);
    fetchAsset({ variables: { businessId: String(vendorId) } });
  };

  const transactionHistory = transactionData?.transactions || [];

const handleCloseStatusModal = () => {
  setTxStatusModal({ isOpen: false, status: "loading", transactionInfo: {}, delayActionLoading: null });
  setActiveTxId(null);
};

const handleDelayResponse = async (decision) => {
  const loadingKey =
    decision === "WAIT" ? "keepWaiting"  : decision === "CANCEL" ? "selectVendor" :  "autoAssign";
 
  setTxStatusModal((prev) => ({ ...prev, delayActionLoading: loadingKey }));
 
  try {
    await respondToTransaction({
      variables: {
        txnId: activeTxId,
        decision,
      },
    });
 
    if (decision === "WAIT") {
      setTxStatusModal((prev) => ({
        ...prev,
        status: "loading",
        delayActionLoading: null,
      }));
 
    } else if (decision === "SYSTEM_SEARCH") {
      setTxStatusModal((prev) => ({
        ...prev,
        status: "loading",
        delayActionLoading: null,
      }));
      toast.info("Looking for the nearest available vendor…");
 
    } else if (decision === "CANCEL") {
      handleCloseStatusModal();
      toast.info("Select a vendor and initiate a new request.");
    }
 
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong. Please try again.");
    setTxStatusModal((prev) => ({ ...prev, delayActionLoading: null }));
  }
};

  const MapModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">
            Route to {selectedStore?.name}
          </h3>
          <button
            onClick={closeMap}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex h-[600px]">
          <div className="flex-1 relative">
            {isLoadingRoute ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin mr-2" size={24} />
                <span>Loading route...</span>
              </div>
            ) : (
              <div ref={mapRef} className="w-full h-full" />
            )}
          </div>
          
          {mapData && (
            <div className="w-80 bg-gray-50 p-4 overflow-y-auto">
              <h4 className="font-semibold text-gray-800 mb-3">Route Instructions</h4>
              <div className="space-y-2">
                {getRouteInstructions().map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-sm text-gray-700 flex-1">{instruction}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-white rounded-lg">
                <h5 className="font-medium text-gray-800 mb-2">Route Details</h5>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Mode: {mapData.properties?.mode || 'Walking'}</p>
                  <p>Distance: {mapData.features[0]?.properties?.distance || 0}m</p>
                  <p>Duration: {mapData.features[0]?.properties?.time || 0}min</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

    return (
    <div className="min-h-screen bg-gray-50 py-6 px-2 md:p-6">
      <Navbar user={ userData } />
      <div className="max-w-7xl mx-auto mt-14">
        <div className="mb-8">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900 mb-1">Welcome, {userData?.fullName ?? userData?.email} 👋</h1>
          {/* <p className="text-sm text-gray-500">Member Since April 30, 2025</p> */}
        </div>

        <div className="mb-8">
            <div className="lg:flex gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm md:w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Total Transactions Count</h2>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {`${analyticsData?.analytics?.totalTransactions || 0}`}
                  <div/>
                </div>
              </div>
            </div>

              <div className="mt-5 lg:mt-0 bg-white rounded-2xl p-6 shadow-sm md:w-[300px]">
                <div className="flex itesm-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Fulfilled Transactions Value</h2>
                  <ArrowUpRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {`₦${analyticsData?.analytics?.totalTransactionValue}`}
                  </div>
                </div>
              </div>

            <div className="mt-5 lg:mt-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-sm md:w-[300px]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Current Month Transactions Value</h2>
                  <ArrowUpRight className="w-5 h-5 text-white/80" />
                </div>
                 <div className="mb-4">
                  <div className="text-2xl font-bold text-white/80 mb-1">₦{`${analyticsData?.analytics?.currentMonthTransactionValue || 0}`}</div>
                </div> 
              </div>
            </div>
        </div>

      
      </div>


        <div className='w-full grid sm:grid-cols-1 md:grid-cols-2  gap-6 mt-10'>
              <div className="bg-grey-50 rounded-2xl py-6 px-3 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Nearby Vendors</h2>
                {/* <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  See All
                </button> */}
              </div>
            <div className="space-y-4">
              {!data?.businessesAroundMe?.length && (
                <EmptyTableState title="No nearby vendor within your current location." description="Vendors within 15 Kilometers from you will appear here."/>
              )}
        {data?.businessesAroundMe?.map((store, index) => (
          <div key={store.id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center hover:scale-105 justify-between px-3 py-5 hover:bg-gray-50 transition-all duration-300">
              <div className="flex items-center">
                <div className={`w-10 h-10 ${getAvatarColor(index)} rounded-full flex items-center justify-center mr-3 shadow-sm`}>
                  <span className="text-white text-sm font-medium">
                    {store.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">{store?.name}</div>
                  <div className="text-sm text-gray-500"> {store?.distance} km away {Object.is(store?.nearest, true) && "(Nearest)"}</div>
                </div>
              </div>
              <div
                className={
                  `online-status w-3 h-3 rounded-[50%] ${store?.isOnline ? 'bg-green-500' : 'bg-slate-300'}`
                }
                title={store?.isOnline ? 'Online' : 'Offline'}
              >
              </div>
              <div className="flex items-center space-x-2">
                {/* <button
                  onClick={() => handleViewOnMap(store)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
                  title="View on map"
                >
                  <MapPin size={20} />
                </button> */}
                 
                <button
                  onClick={() => ViewAssets(store.id)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                  title={expandedCards.has(store.id) ? "Collapse" : "Expand"}
                >
                  {expandedCards.has(store.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>
            </div>
            
            {expandedCards.has(store.id) && (
              <div className="px-3 pb-5 border-t border-gray-100">
                <div className="pt-4">
                 <div className="flex justify-between">
                   <h4 className="font-medium text-gray-800 mb-3">Cash Range</h4>
                   <p>Charges</p>
                 </div>
                  <div className="space-y-2">
                    {assetData?.businessAssets?.map((priceRange, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Range: {priceRange.range}</span>
                        <span className="font-medium text-green-600">₦{priceRange.chargeRate}</span>
                        <button
                          onClick={() => handleInitiateTransaction(store, priceRange?.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Request Cash
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        
      </div>

       {showTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
          <div className="bg-black border border-gray-700 rounded-xl w-full max-w-lg p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowTransactionModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold mb-4 text-gray-400">
              Withdraw from {selectedVendor?.name}
            </h2>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-400">Amount to Withdraw</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 text-white border border-gray-600 rounded-lg"
                placeholder="Enter amount"
              />
            </div>

            {/* Policies */}
            <div className="mb-4">
              <p className="text-sm mb-2 text-gray-400">Select mode of collection</p>
              {policiesLoading ? (
                <p>Loading policies...</p>
              ) : (
                <div className="space-y-2">
                  {/* {policiesData?.businessTransactionPolicyForUser?.map((policy) => (
                    
                  ))} */}
                  <div
                      onClick={() => setSelectedPolicy(policiesData?.businessTransactionPolicyForUser?.cashCollectionMode)}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedPolicy?.id === policiesData?.businessTransactionPolicyForUser?.cashCollectionMode
                          ? "border-white bg-gray-800"
                          : "border-gray-600"
                      }`}
                    >
                      <p className="text-sm text-gray-400">
                        Mode: {policiesData?.businessTransactionPolicyForUser?.cashCollectionMode}
                      </p>
                    </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmitTransaction}
              disabled={creating}
              className="w-full py-2 bg-white text-black rounded-lg font-semibold flex items-center justify-center"
            >
              {creating && <Loader2 className="animate-spin mr-2" size={16} />}
              Create Transaction
            </button>
          </div>
        </div>
      )}

      {showLocationModal && <LocationModal />}
      {showMap && <MapModal />}
            </div>

             <div className="bg-grey-50 rounded-2xl py-6 px-3 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
              <div className="md:flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
               <div className="flex items-center gap-10 pt-5 md:pt-0">
                 <TransactionFilter statusMap={statusMap} refetch={refetch} user={userData}/>
                <div className="flex justify-between items-center">
                  <button
                    onClick={handlePrevious}
                    disabled={pageNumber === 1}
                    className="p-2 bg-gray-300 text-gray-800 rounded-[100%] hover:bg-gray-400 disabled:opacity-50"
                  >
                    <ArrowLeft />
                  </button>


                  <button
                    onClick={handleNext}
                    className="ml-3 p-2 bg-gray-300 text-gray-800 rounded-[100%] hover:bg-gray-400"
                  >
                    <ArrowRight />
                  </button>
                </div>

               </div>
              </div>
              
              <div className="space-y-4">
                 {!transactionHistory?.length && (
                <EmptyTableState description='All your transactions will appear here.'/>
              )}
                {transactionHistory.map((tx, index) => (
                  <TransactionCard
                      transaction={tx}
                      index={index}
                      refetch={refetch}
                      onReject={(id) => console.log("Reject:", id)}
                      key={tx.id}
                    />

                ))}
              </div>
            </div>

           
            </div>

             <div className='w-full grid sm:grid-cols-1 md:grid-cols-2  gap-6 mt-20'>
             

         
            </div>

            <TransactionStatusModal
              isOpen={txStatusModal.isOpen}
              status={txStatusModal.status}
              transactionInfo={txStatusModal.transactionInfo}
              delayActionLoading={txStatusModal.delayActionLoading}
              onClose={handleCloseStatusModal}
              onKeepWaiting={() => handleDelayResponse("WAIT")}
              onSelectVendor={() => handleDelayResponse("CANCEL")}
              onAutoAssign={() => handleDelayResponse("SYSTEM_SEARCH")}
            />
    </div>
  );
}