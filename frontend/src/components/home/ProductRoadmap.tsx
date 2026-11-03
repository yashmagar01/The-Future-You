import { useState } from "react";
import { CheckCircle2, Clock, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { timelineData, type Milestone } from "@/data/timelineData";

interface ProductRoadmapProps {
  userRole?: 'admin' | 'tester' | 'user';
}

const ProductRoadmap = ({ userRole = 'user' }: ProductRoadmapProps) => {
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);

  const toggleMilestone = (id: string) => {
    setExpandedMilestone(expandedMilestone === id ? null : id);
  };

  const getStatusIcon = (status: Milestone['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-6 w-6" />;
      case 'scheduled':
        return <Clock className="h-6 w-6" />;
      case 'future':
        return <Sparkles className="h-6 w-6" />;
    }
  };

  const getAccessButton = (milestone: Milestone) => {
    if (!milestone.accessButton) return null;

    const isPrivileged = userRole === 'admin' || userRole === 'tester';
    const buttonText = isPrivileged 
      ? milestone.accessButton.admin 
      : milestone.accessButton.user;

    return (
      <Button 
        variant={isPrivileged ? "default" : "outline"}
        size="sm"
        className={`mt-4 ${isPrivileged ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
      >
        {buttonText}
      </Button>
    );
  };

  return (
    <section className="py-20 px-4 bg-muted/30" aria-labelledby="roadmap-heading">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Product Roadmap
          </div>
          <h2 id="roadmap-heading" className="text-4xl font-bold mb-4">Our Journey Forward</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Track our progress from MVP launch to dream features — transparency in every milestone
          </p>
        </div>

        {/* Desktop: Horizontal Timeline */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Timeline Line — removed */}

            <div className="grid grid-cols-3 gap-8">
              {timelineData.map((milestone, index) => (
                <div key={milestone.id} className="relative">
                  {/* Milestone Node */}
                  <div className="flex flex-col items-center mb-6">
                    <div className={`h-16 w-16 rounded-full ${milestone.color.indicator} flex items-center justify-center text-white shadow-lg z-10 ring-4 ring-background`}>
                      {getStatusIcon(milestone.status)}
                    </div>
                  </div>

                  {/* Milestone Card */}
                  <Card className={`p-6 border-2 ${milestone.color.border} ${milestone.color.bg} hover:shadow-xl transition-all`}>
                    <div className="text-center mb-4">
                      <h3 className={`text-xl font-bold mb-2 ${milestone.color.text}`}>
                        {milestone.title}
                      </h3>
                      <p className="text-sm font-semibold text-muted-foreground">
                        {milestone.date}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                      {milestone.description}
                    </p>

                    {/* Features List */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                        Features:
                      </p>
                      <ul className="space-y-1.5" role="list">
                        {milestone.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${milestone.color.indicator} flex-shrink-0`} 
                                 aria-hidden="true" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Access Button */}
                    <div className="text-center">
                      {getAccessButton(milestone)}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile: Vertical Collapsible Timeline */}
        <div className="lg:hidden space-y-6">
          {timelineData.map((milestone, index) => {
            const isExpanded = expandedMilestone === milestone.id;

            return (
              <div key={milestone.id} className="relative">
                {/* Vertical Line Connector */}
                {index < timelineData.length - 1 && (
                  <div className={`absolute left-6 top-16 w-1 h-12 ${milestone.color.indicator}`}
                       aria-hidden="true" />
                )}

                <Card className={`p-6 border-2 ${milestone.color.border} ${milestone.color.bg}`}>
                  {/* Header - Always Visible */}
                  <button
                    onClick={() => toggleMilestone(milestone.id)}
                    className="w-full text-left"
                    aria-expanded={isExpanded}
                    aria-controls={`milestone-${milestone.id}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`h-12 w-12 rounded-full ${milestone.color.indicator} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
                        {getStatusIcon(milestone.status)}
                      </div>

                      {/* Title & Date */}
                      <div className="flex-1">
                        <h3 className={`text-lg font-bold mb-1 ${milestone.color.text}`}>
                          {milestone.title}
                        </h3>
                        <p className="text-sm font-semibold text-muted-foreground">
                          {milestone.date}
                        </p>
                      </div>

                      {/* Expand Icon */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Collapsible Content */}
                  {isExpanded && (
                    <div 
                      id={`milestone-${milestone.id}`}
                      className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in"
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {milestone.description}
                      </p>

                      {/* Features List */}
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          Features:
                        </p>
                        <ul className="space-y-1.5" role="list">
                          {milestone.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <div className={`mt-1.5 h-1.5 w-1.5 rounded-full ${milestone.color.indicator} flex-shrink-0`} 
                                   aria-hidden="true" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Access Button */}
                      <div className="text-center">
                        {getAccessButton(milestone)}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            );
          })}
        </div>

        {/* Status Legend */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-green-600">Coming Soon</span> - Q1 2027
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-blue-500" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-blue-600">Planned</span> - Q1 2027 & Beyond
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-purple-500" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-purple-600">Dream</span> - 2027
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-orange-500" aria-hidden="true" />
            <span className="text-muted-foreground">
              <span className="font-semibold text-orange-600">Future</span> - 2030
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductRoadmap;
