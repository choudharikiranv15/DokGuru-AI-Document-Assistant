import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Github, Linkedin, Youtube } from 'lucide-react';

export const Footer = () => {
    const columns = [
      {
        title: 'Product',
        links: [
          { name: 'Features', to: '/features' },
          { name: 'Pricing', to: '/pricing' },
          { name: 'Method', to: '/method' },
          { name: 'Download', to: '#' },
        ],
      },
      {
        title: 'Company',
        links: [
          { name: 'About', to: '/company' },
          { name: 'Blog', to: '#' },
          { name: 'Careers', to: '#' },
          { name: 'Customers', to: '#' },
        ],
      },
      {
        title: 'Resources',
        links: [
          { name: 'Documentation', to: '#' },
          { name: 'Help Center', to: '#' },
          { name: 'Community', to: '#' },
          { name: 'API', to: '#' },
        ],
      },
      {
        title: 'Legal',
        links: [
          { name: 'Privacy Policy', to: '#' },
          { name: 'Terms of Service', to: '#' },
          { name: 'Cookie Policy', to: '#' },
        ],
      },
    ];

    return (
      <footer className="w-full bg-background border-t border-white/5 pt-20 pb-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-20">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-6 group">
                <div className="w-6 h-6 bg-white rounded flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <div className="w-3 h-3 border-2 border-black rounded-sm rotate-45" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">DokGuru</span>
              </Link>
              <p className="text-muted text-[14px] leading-relaxed max-w-[200px]">
                The vocal intelligence platform for modern knowledge workers.
              </p>
              <div className="flex gap-4 mt-6">
                <Twitter size={18} className="text-muted hover:text-white transition-colors cursor-pointer" />
                <Github size={18} className="text-muted hover:text-white transition-colors cursor-pointer" />
                <Linkedin size={18} className="text-muted hover:text-white transition-colors cursor-pointer" />
              </div>
            </div>
  
            {columns.map((column) => (
              <div key={column.title}>
                <h4 className="text-white text-[14px] font-semibold mb-6">{column.title}</h4>
                <ul className="space-y-4">
                  {column.links.map((link) => (
                    <li key={link.name}>
                      <Link to={link.to} className="text-muted hover:text-white transition-colors text-[14px]">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 gap-4">
          <p className="text-muted text-[13px]">
            &copy; 2025 DokGuru Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-muted text-[13px] hover:text-white transition-colors cursor-pointer">Status</span>
            <span className="text-muted text-[13px] hover:text-white transition-colors cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
