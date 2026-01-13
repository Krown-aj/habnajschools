import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, } from 'react-icons/fa';

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
    student1: "/assets/students1.j",
    student2: "/assets/students2.webp",
    student3: "/assets/students3.webp",
    student4: "/assets/students4.webp",
    student5: "/assets/students5.webp",
    student6: "/assets/students6.webp",
    student7: "/assets/students7.webp",
    student8: "/assets/students8.webp",

    principal: "/assets/Musa.webp",
    headteacher: "/assets/headteacher.webp",
    management: "/assets/Musa.webp",
    proprietor: "/assets/proprietor.webp",
    director: "/assets/director.webp",

    basketball: "/assets/basketball.webp",
    invest: "/assets/invest.webp",
    quest: "/assets/quest.webp",
    computerroom: "/assets/computerroom.webp",
    computerroom2: "/assets/computerroom2.webp",

    primary: "/assets/primary.webp",
    nursery: "/assets/nursery.webp",
    jss: "/assets/jss.webp",
    jss2: "/assets/jss2.webp",

    habnaj: "/assets/habnaj.webp",
    headboy: "/assets/headboy.webp",
    footballer: "/assets/footballer.webp",
    engineer: "/assets/engineer.webp",
    doctors: "/assets/doctors.webp",
    teachers: "/assets/teachers.webp",
    careerday: "/assets/careerday.webp",
    lawyers: "/assets/lawyers.webp",
    military: "/assets/military.webp",
    pilots: "/assets/pilots.webp",
};

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