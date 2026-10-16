// Starting content. The site shows this until you change it in the admin
// dashboard (Admin → Workshop & programs → "Load starting content").
export const DEFAULT_WORKSHOP = {
  title: "Career & Placement Guidance Workshop on Premium IT Jobs",
  date: "Saturday, 17 October 2026",
  time: "5:30 PM – 8:00 PM",
  venue: "Elements Restobar, P.B. Road, Davanagere",
  by: "SanRadiance Technologies Pvt. Ltd., Bengaluru, in association with JayathiSoft",
  topics: [
    "Career opportunities in IT and where the high-paying roles are",
    "Industry skills companies expect today",
    "Interview preparation: technical, HR and communication",
    "Placement guidance and how hiring works at leading companies",
    "Training and internship paths to get there"
  ],
  companies: ["Google", "Microsoft", "Accenture", "Cognizant", "Capgemini", "Infosys", "IBM", "VMware", "Cisco", "NetApp", "SanDisk", "AMD", "Intel", "Dell", "HP", "Nutanix", "Apple"],
  phone: "84968 75863",
  email: "contact@sanradiance.com",
  websites: "sanradiance.com · jayathisoft.com",
  whatsappUrl: "https://chat.whatsapp.com/G8KlhxQWQ31KZGbOYFRLEf",
  address: "SanRadiance HQ: Arekere, Bengaluru 560076"
};

export const DEFAULT_PROGRAMS = [
  { order: 1, org: "JayathiSoft", name: "AI Infra Engineer", tag: "Training", dur: "On enquiry", fee: "On enquiry", batch: "To confirm", mode: "Classroom / online",
    syllabus: ["DevOps", "Servers & virtualization", "Kubernetes", "Python"], outcomes: "Run infrastructure for AI and enterprise systems." },
  { order: 2, org: "JayathiSoft", name: "Systems Engineer & AI", tag: "Training", dur: "On enquiry", fee: "On enquiry", batch: "To confirm", mode: "Classroom / online",
    syllabus: ["Servers & operating systems", "Python", "Tools & monitoring", "Storage, networking & security basics"], outcomes: "Work on product-company systems engineering teams." },
  { order: 3, org: "JayathiSoft", name: "AI/ML & Data Science", tag: "Training", dur: "On enquiry", fee: "On enquiry", batch: "To confirm", mode: "Classroom / online",
    syllabus: ["Python", "ML algorithms", "Deep learning", "AI projects"], outcomes: "Build and present ML and AI projects." },
  { order: 4, org: "JayathiSoft", name: "Full Stack Development", tag: "Training", dur: "On enquiry", fee: "On enquiry", batch: "To confirm", mode: "Classroom / online",
    syllabus: ["React", "Node.js", "AWS", "Project work"], outcomes: "Build and deploy full-stack web applications. For students with strong coding skills." },
  { order: 5, org: "JayathiSoft", name: "Go Systems Engineer", tag: "Training", dur: "On enquiry", fee: "On enquiry", batch: "To confirm", mode: "Classroom / online",
    syllabus: ["Go programming", "Servers & operating systems", "Tools & monitoring"], outcomes: "Write systems software in Go." },
  { order: 6, org: "JayathiSoft", name: "C++ Systems Development", tag: "Training", dur: "On enquiry", fee: "On enquiry", batch: "To confirm", mode: "Classroom / online",
    syllabus: ["C++", "Operating systems", "Virtualization", "DevOps basics"], outcomes: "Work on low-level and systems software." },
  { order: 7, org: "SanRadiance", name: "AI Internship Program", tag: "VTU registered", dur: "13–18 weeks · ~25–30 hrs/week", fee: "On enquiry", batch: "To confirm", mode: "Remote, Bengaluru office or hybrid",
    syllabus: ["Python basics", "Cloud fundamentals & operations", "GitHub workflows", "System thinking", "LLM concepts & deployment basics", "Mentored team projects"],
    outcomes: "Real project experience with a mentor and a VTU-registered internship certificate." }
];

// Alumni success stories from "SanRadiance_JNNCE_Success_Since_2010.pdf".
// Shown to students until you click "Load these stories" in Admin → Testimonials;
// after that, the stories in the admin dashboard are used instead.
export const DEFAULT_TESTIMONIALS = [
  { order: 1, name: "Deekshith Bennur", role: "Senior Software Engineer", company: "Walmart Global Tech", college: "Visvesvaraya Technological University", location: "Bengaluru, Karnataka", skills: ["Java", "Kubernetes", "Microservices", "Cloud-Native"], photo: "assets/stories/deekshith-bennur.jpg" },
  { order: 2, name: "Umesh Nadig", role: "Senior Software Engineer", company: "Hewlett-Packard (HPE)", college: "Manipal University", location: "Bengaluru, Karnataka", skills: [], photo: "assets/stories/umesh-nadig.jpg" },
  { order: 3, name: "Yuvaraj S H", role: "Senior Software Development Engineer", company: "Western Digital", college: "", location: "Bengaluru, Karnataka", skills: [], photo: "assets/stories/yuvaraj-sh.jpg" },
  { order: 4, name: "Raghavendra D G", role: "Platform Test Engineer", company: "Western Digital", college: "Jawaharlal Nehru National College of Engineering", location: "Bengaluru, Karnataka", skills: ["Product Testing", "Data Storage Solutions"], photo: "assets/stories/raghavendra-dg.jpg" },
  { order: 5, name: "Rohit Mishra", role: "QA Lead", company: "Siemens Gamesa", college: "Visvesvaraya Technological University", location: "Noida, Uttar Pradesh", skills: [], photo: "assets/stories/rohit-mishra.jpg" },
  { order: 6, name: "Jyothi T S", role: "Developer", company: "Sapiens", college: "", location: "Bengaluru, Karnataka", skills: [], photo: "assets/stories/jyothi-ts.jpg" }
].map((t) => ({ course: "", story: "", pkg: "", video: "", consent: true, verified: true, show: true, ...t }));

export const INCLUDED = [
  "Basics → project work → soft skills → technology",
  "Hands-on projects for your portfolio",
  "Interview preparation and mock interviews",
  "Communication, teamwork and personal branding",
  "Placement guidance and referrals",
  "VTU-registered certificate (SanRadiance internship)"
];

export const ROLES = ["Student / job seeker", "Working professional", "Parent", "Placement officer", "Education promoter"];
export const QUALIFICATIONS = ["Diploma", "B.E. / B.Tech", "BCA", "B.Sc", "B.Com", "MCA", "M.Tech / M.Sc", "MBA", "Other"];
export const STATUSES = ["New", "Called", "Visited centre", "Enrolled", "Not interested"];
