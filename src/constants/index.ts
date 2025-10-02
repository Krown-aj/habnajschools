import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, } from 'react-icons/fa';
import student1 from "@/assets/students1.png";
import student2 from "@/assets/students2.png";
import student3 from "@/assets/students3.png";
import student4 from "@/assets/students4.png";
import student5 from "@/assets/students5.png";
import student6 from "@/assets/students6.png";
import student7 from "@/assets/students7.png";
import student8 from "@/assets/students8.png";
import principal from "@/assets/Musa.jpg";
import headteacher from "@/assets/headteacher.png";
import management from "@/assets/Musa.jpg";
import proprietor from "@/assets/proprietor.jpg";
import director from "@/assets/director.jpg";
import basketball from "@/assets/basketball.jpg";
import invest from "@/assets/invest.jpg";
import quest from "@/assets/quest.jpg";
import computerroom from "@/assets/computerroom.jpg";
import computerroom2 from "@/assets/computerroom2.jpg";
import primary from "@/assets/primary.jpg";
import nursery from "@/assets/nursery.jpg";
import jss from "@/assets/jss.jpg";
import jss2 from "@/assets/jss2.jpg";
import habnaj from "@/assets/habnaj.jpg";

// Type definitions for menu
export interface SubLink {
    name: string;
    link: string;
}

export interface SubMenuGroup {
    Head: string;
    sublink: SubLink[];
}

export interface MenuItem {
    name: string;
    link?: string;
    submenu?: boolean;
    sublinks?: SubMenuGroup[];
}

export const links: MenuItem[] = [
    {
        name: 'Administration', submenu: true, sublinks: [
            {
                Head: 'Centeral Admin',
                sublink: [
                    { name: 'Exams & Records', link: '/exams-records' },
                    { name: 'The Admission Unit', link: '/admission-units' },
                    { name: 'Boarding Students', link: '/boarding-students' },
                    { name: 'Day Students', link: '/day-students' },
                ]
            },
            {
                Head: 'Centers',
                sublink: [
                    { name: 'Skill Acquisition', link: '/skill-acquisition' },
                    { name: 'ICT Center', link: '/ict-center' },
                ]
            },
        ]
    },
    {
        name: 'Admission', submenu: true, sublinks: [
            {
                Head: 'Sections',
                sublink: [
                    { name: 'Nursery Section', link: '/admission-nursery' },
                    { name: 'Primary Section', link: '/admission-primary' },
                    { name: 'Junior Section', link: '/admission-junior' },
                    { name: 'Senior Section', link: '/admission-senior' },
                ]
            },
            {
                Head: 'Fees & Scholarship',
                sublink: [
                    { name: 'Schedule of fees', link: '/schedule-fees' },
                    { name: 'Part Time Fees', link: '/part-time-fees' },
                    { name: 'Available Scholarship', link: '/avaiable-schoolarship' },
                ]
            },
        ]
    },
    {
        name: 'About Us', submenu: true, sublinks: [
            {
                Head: 'Habnaj International',
                sublink: [
                    { name: 'Proprietor', link: '/about-proprietor' },
                    { name: 'Principal', link: '/about-principal' },
                    { name: 'Head Master', link: '/about-head-master' },
                    { name: 'Nursery Head', link: '/about-nursery-head' },
                    { name: 'Mission', link: '/about-mission' },
                    { name: 'Vision', link: '/about-vision' },
                ]
            },
            {
                Head: 'Units & Sections',
                sublink: [
                    { name: 'Nursery Section', link: '/about-nursery-section' },
                    { name: 'Primary Section', link: '/about-primary-section' },
                    { name: 'Junior Section', link: '/about-junior-section' },
                    { name: 'Senior Section', link: '/about-senior-section' },
                ]
            },
        ]
    },
    {
        name: 'Research', submenu: true, sublinks: [
            {
                Head: 'Research',
                sublink: [
                    { name: 'Research Policy', link: '/research-policy' },
                    { name: 'Academic Journals', link: '/academic-journals' },
                    { name: 'Publications', link: '/publications' },
                ]
            },
            {
                Head: 'Resources',
                sublink: [
                    { name: 'Library Policy', link: '/library-policy' },
                    { name: 'Repository Journals', link: '/repository-journals' },
                    { name: 'E-Learning', link: '/e-learning' },
                    { name: 'OER', link: '/oer' },
                ]
            },
        ]
    },
    {
        name: 'News & Media', submenu: true, sublinks: [
            {
                Head: 'News Updates',
                sublink: [
                    { name: 'College News', link: '/college-news' },
                    { name: 'College Bulletin', link: '/college-bulletin' },
                    { name: 'Photo Gallary', link: '/photo-gallary' },
                ]
            },
        ]
    },
    { name: 'Contact', link: '/contact' },
];

export const footerLinks = {
    academics: [
        { name: 'Nursery School', href: '/about-us/nursery-school' },
        { name: 'Primary School', href: '/about-us/primary-school' },
        { name: 'Secondary School', href: '/about-us/secondary-school' },
    ],
    admissions: [
        { name: 'How to Apply', href: '/admissions/how-to-apply' },
        { name: 'Requirements', href: '/admissions/requirements' },
        { name: 'Fees Structure', href: '/admissions/fees-structure' },
    ],
    school: [
        { name: 'Our Mission & Vision', href: '/about-us/mission-vision' },
        { name: 'Our History', href: '/about-us/history' },
        { name: 'News & Events', href: '/news/school-news' },
    ],
    support: [
        { name: 'Contact Us', href: '/contact/contact-us' },
        { name: 'Help Center', href: '/contact/subscribe' },
    ]
};

export const socialLinks = [
    { icon: FaFacebookF, href: 'https://facebook.com/habnajinternationalschool', color: 'hover:text-blue-600' },
    { icon: FaTwitter, href: 'https://twitter.com/habnajinternationalschool', color: 'hover:text-blue-400' },
    { icon: FaInstagram, href: 'https://instagram.com/habnajinternationalschool', color: 'hover:text-pink-500' },
    { icon: FaLinkedinIn, href: 'https://linkedin.com/company/habnajinternationalschool', color: 'hover:text-blue-700' },
];

export const images = {
    student1,
    student2,
    student3,
    student4,
    student5,
    student6,
    student7,
    student8,
    principal,
    headteacher,
    management,
    proprietor,
    director,
    basketball,
    invest,
    quest,
    computerroom,
    computerroom2,
    primary,
    nursery,
    jss,
    jss2,
    habnaj,
}

export const CONTACT = {
    email: "habnaj2021international@gmail.com",
    phone: "+234 905 498 5027",
    tel: "+2349054985027",
    address: "Plot D12, Sam Njoma Street, GRA, Bauchi, Bauchi State, Nigeria."
}

export const MANAGEMENT = {
    director: {
        name: "Hajiya Zainab S. Musa",
        qualification: "B.Sc. Sociology & Anthropology",
        contact: "+234 803 964 5078",
        email: "zeelams05@gmail.com"
    },
    proprietor: {
        name: "Engr. Professor Shuaibu M. Musa",
        qualification: "FNSE, FNIAE",
        contact: "+234 814 349 1503",
        email: "shbmusa@atbu.edu.ng"
    },
    principal: {
        name: "Mr. Musa Zakariyya",
        qualification: "B.Tech. Information and Communication Technology",
        contact: "+234 803 345 6789",
        email: "maryammusa@example.com"
    },
    headteacher: {
        name: "Mr. Dahiru Muhammad Inuwa",
        contact: "+234 803 456 7890",
        email: "dahiru.inuwa@example.com"
    }
}
export const ACCOUNT = [
    { bank: "Zenith Bank PLC", name: "Habnaj International School", number: "1228929324" },
    /* { bank: "GT Bank", name: "Habnaj International School", number: "" },
    { bank: "Access Bank", name: "Habnaj International School", number: "" }, */
]

export const SCHOOL = {
    name: "Habnaj International School",
    tagline: "Excellence and Integrity in Education",
    motto: "Knowledge is Power",
    vision: "To be a leading private educational institution that nurtures morally upright, intellectually sound, and socially responsible individuals, equipped with the skills, knowledge, and values to excel in a changing world",
    mission: "To provide holistic education that fosters academic excellence, critical thinking, and lifelong learning to meet the diverse needs of our dynamic society through the promotion of strong moral and ethical values as well as honesty and transparency, to prepare students for future leadership.",
};