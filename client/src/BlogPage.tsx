import React from 'react';
import { Calendar, User, ArrowRight, Tag } from 'lucide-react';

const MOCK_BLOGS = [
    {
        id: 1,
        title: "Understanding CDC: Crossing Clock Domains Safely",
        summary: "Asynchronous clock domain crossing is one of the most common causes of chip failure. Learn the standard 2-FF synchronizer and FIFO techniques.",
        author: "Dr. Verilog",
        date: "Feb 10, 2024",
        tags: ["ASIC Design", "Verification"],
        image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 2,
        title: "SystemVerilog Interfaces: A Practical Guide",
        summary: "Stop connecting hundreds of wires manually. Interfaces bundle signals together to make your testbenches cleaner and more reusable.",
        author: "Chip Architect",
        date: "Feb 8, 2024",
        tags: ["SystemVerilog", "RTL"],
        image: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&q=80&w=800"
    },
    {
        id: 3,
        title: "The Future of RISC-V in 2024",
        summary: "Open source silicon is changing the landscape. Here's what to expect from the RISC-V ecosystem this year.",
        author: "OpenSil",
        date: "Feb 5, 2024",
        tags: ["Architecture", "Industry News"],
        image: "https://images.unsplash.com/photo-1591453089816-0fbb971b454c?auto=format&fit=crop&q=80&w=800"
    }
];

export default function BlogPage() {
    return (
        <div className="min-h-screen pt-24 px-6 pb-12">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Engineering <span className="text-gradient">Insights</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Deep dives into Digital Design, Computer Architecture, and Verification from industry experts.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {MOCK_BLOGS.map((blog) => (
                        <article key={blog.id} className="glass-card rounded-2xl overflow-hidden group hover:-translate-y-1 transition-transform cursor-pointer">

                            {/* Image */}
                            <div className="h-48 overflow-hidden relative">
                                <img
                                    src={blog.image}
                                    alt={blog.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                <div className="absolute bottom-4 left-4 flex gap-2">
                                    {blog.tags.map(tag => (
                                        <span key={tag} className="text-[10px] font-bold uppercase tracking-wider bg-blue-600/80 backdrop-blur px-2 py-1 rounded text-white">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {blog.date}</span>
                                    <span className="flex items-center gap-1"><User size={12} /> {blog.author}</span>
                                </div>

                                <h3 className="text-xl font-bold mb-3 group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {blog.title}
                                </h3>

                                <p className="text-gray-400 text-sm leading-relaxed mb-6 line-clamp-3">
                                    {blog.summary}
                                </p>

                                <div className="flex items-center text-blue-500 font-bold text-sm gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                    Read Article <ArrowRight size={16} />
                                </div>
                            </div>

                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
