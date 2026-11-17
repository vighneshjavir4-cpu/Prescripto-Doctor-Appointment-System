import React, { use, useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import RelatedDoctors from '../components/RelatedDoctors'
import { toast } from 'react-toastify'
import axios from 'axios'

const Appointment = () => {
    const { docId } = useParams()
    const { doctors, currencySymbol, token, backendUrl, getDoctorsData } = useContext(AppContext)
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

    const navigate = useNavigate()

    const [docInfo, setDocInfo] = useState(null)
    const [docSlots, setDocSlots] = useState([])
    const [slotIndex, setSlotIndex] = useState(0)
    const [slotTime, setSlotTime] = useState('')


    const fetchDocInfo = async () => {
        const docInfo = doctors.find((doc) => doc._id === docId)
        setDocInfo(docInfo)
    }

    const getAvailableSlots = () => {
        if (!docInfo) return

        const now = new Date()
        const availableSlots = []
        const bookedSlots = docInfo.slots_booked || {}

        for (let i = 0; availableSlots.length < 7; i++) {
            const currentDate = new Date(now)
            currentDate.setDate(now.getDate() + i)

            const endTime = new Date(currentDate)
            endTime.setHours(21, 0, 0, 0)

            if (i === 0) {
                const minutes = currentDate.getMinutes()
                currentDate.setSeconds(0, 0)
                currentDate.setMinutes(minutes < 30 ? 30 : 0)
                if (minutes >= 30) currentDate.setHours(currentDate.getHours() + 1)
                if (currentDate.getHours() < 10) currentDate.setHours(10, 0, 0, 0)
            } else {
                currentDate.setHours(10, 0, 0, 0)
            }

            const timeSlots = []

            while (currentDate < endTime) {
                let formattedTime = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                let day = currentDate.getDate()
                let month = currentDate.getMonth() + 1
                let year = currentDate.getFullYear()

                const slotDate = day + "_" + month + "_" + year
                const slotTime = formattedTime

                const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false : true

                if (isSlotAvailable) {
                    // add slot to array 
                    timeSlots.push({
                        datetime: new Date(currentDate),
                        time: formattedTime
                    })
                }


                // increament current time by 30 min 
                currentDate.setMinutes(currentDate.getMinutes() + 30)
            }

            if (timeSlots.length > 0) availableSlots.push(timeSlots)
        }

        setDocSlots(availableSlots)
        setSlotIndex(0)
        setSlotTime('')
    }

    const bookAppointment = async () => {
        if (!token) {
            toast.warn('Login to book appointment')
            return navigate('/login')
        }

        try {
            const date = docSlots[slotIndex][0].datetime

            let day = date.getDate()
            let month = date.getMonth() + 1
            let year = date.getFullYear()

            const slotDate = day + "_" + month + "_" + year

            const { data } = await axios.post(backendUrl + '/api/user/book-appointment', { docId, slotDate, slotTime }, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                getDoctorsData()
                navigate('/my-appointment')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            console.log(error)
            toast.error(error.message)

        }
    }
    useEffect(() => {
        fetchDocInfo()
    }, [doctors, docId])

    useEffect(() => {
        getAvailableSlots()
    }, [docInfo])

    useEffect(() => {
        console.log(docSlots)
    }, [docSlots])

    return docInfo && (
        <div>
            {/* ------ Doctors Details ------ */}
            <div className='flex flex-col sm:flex-row gap-4'>
                <div>
                    <img className='bg-primary w-full sm:max-w-72 rounded-lg' src={docInfo.image} alt='' />
                </div>
                <div className='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>
                    {/* ------- DocInfo - name, degree , experience ------- */}
                    <p className='flex items-center gap-2 text-2xl font-medium text-gray-900'>
                        {docInfo.name}
                        <img className='w-5' src={assets.verified_icon} alt='' />
                    </p>
                    <div className='flex items-center gap-2 text-sm mt-1 text-gray-600'>
                        <p>{docInfo.degree} - {docInfo.speciality}</p>
                        <button className='px-3 py-1 border border-gray-300 text-sm rounded-full bg-gray-50 text-gray-500 whitespace-nowrap'>
                            {docInfo.experience}
                        </button>
                    </div>

                    {/* ----- Doctors Info ----- */}
                    <div>
                        <p className='flex items-center gap-2 text-sm mt-3 text-gray-900 font-medium'>
                            About
                            <img src={assets.info_icon} alt="" />
                        </p>
                        <p className='text-sm text-gray-500 max-w-[700px] mt-1'>{docInfo.about}</p>
                    </div>
                    <p className='text-gray-600 font-medium mt-4'>
                        Appointment Fee:<span className='text-gray-500 '>{currencySymbol}{docInfo.fees}</span>
                    </p>
                </div>
            </div>
            {/* ------ Booking slots ------ */}
            <div className='sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>
                <p>Booking Slots</p>
                <div className='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
                    {docSlots.length && docSlots.map((item, index) => (
                        <div key={index} onClick={() => { setSlotIndex(index); setSlotTime('') }} className={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index ? 'bg-primary text-white' : 'border border-gray-200'}`}>
                            <p>{item[0] && daysOfWeek[item[0].datetime.getDay()]}</p>
                            <p>{item[0] && item[0].datetime.getDate()}</p>
                            <p>{item[0] && item[0].datetime.toLocaleDateString(undefined, { month: 'short' })}</p>
                        </div>
                    ))
                    }
                </div>
                <div className='flex items-center gap-3 w-full overflow-x-scroll mt-4'>
                    {docSlots.length && docSlots[slotIndex].map((item, index) => (
                        <p onClick={() => setSlotTime(item.time)} key={index} className={`text-sm fomt-light flex-shrink-0 px-5 py-2 cursor-pointer rounded-full ${item.time === slotTime ? 'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`}>{item.time.toLowerCase()}</p>
                    ))}
                </div>
                <button onClick={bookAppointment} className='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6'>Book an appointment</button>
            </div>
            <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
        </div>
    )
}

export default Appointment