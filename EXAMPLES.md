# Usage Examples

Real-world examples of using the Instapaper MCP Server with Claude.

## Basic Operations

### Save an Article

**You:**
> Save this article to Instapaper: https://www.nngroup.com/articles/ten-usability-heuristics/
> Title: Nielsen's 10 Usability Heuristics
> Description: Classic reference for UX design principles

**Claude:**
> I've saved the article to your Instapaper. Here's the confirmation:
> - Bookmark ID: 123456
> - Title: Nielsen's 10 Usability Heuristics
> - URL: https://www.nngroup.com/articles/ten-usability-heuristics/

### Check Your Reading Queue

**You:**
> What's in my unread Instapaper queue?

**Claude:**
> You have 23 unread articles in your Instapaper. Here are the most recent:
> 
> 1. "The State of UX in 2024" - Added 2 days ago
> 2. "Designing for Accessibility" - Added 3 days ago
> 3. "Component Libraries Best Practices" - Added 1 week ago
> ...

## Research Workflows

### Topic-Based Research

**You:**
> Find all articles in my Instapaper about "design systems" and give me a synthesis of the key insights

**Claude:**
> [Searches your Instapaper library]
> 
> I found 8 articles about design systems in your library. Here's a synthesis:
> 
> **Key Themes:**
> 1. Governance and Adoption - Multiple articles emphasize...
> 2. Component API Design - Best practices include...
> 3. Documentation - Critical for success...
> 
> **Practical Takeaways:**
> - Start small with core components
> - Involve engineers early in the process
> - Document the "why" not just the "how"

### Weekly Digest

**You:**
> /prompt weekly_reading_digest

**Claude:**
> Here's your weekly reading digest organized by topic:
> 
> **UX Research (5 articles):**
> 1. "Remote User Testing Best Practices" ⭐ Recommended
> 2. "Analyzing Qualitative Data"
> 3. "Recruiting Research Participants"
> ...
> 
> **Design Systems (3 articles):**
> 1. "Figma to Code Workflows"
> 2. "Design Tokens in Practice"
> ...
> 
> **Suggested Reading Order:**
> Start with the starred UX Research article, as it connects to your current project work.

## Content Organization

### Create and Organize Folders

**You:**
> Create a folder called "AI in UX" and move all articles about artificial intelligence in design into it

**Claude:**
> Done! I've:
> 1. Created the folder "AI in UX" (ID: 78910)
> 2. Found 6 articles about AI in design
> 3. Moved them to the new folder:
>    - "ChatGPT for Design Research"
>    - "AI-Powered Prototyping Tools"
>    - "Ethics of AI in UX"
>    - "Generative UI Patterns"
>    - "AI Accessibility Considerations"
>    - "Future of AI Assistants"

### Clean Up Old Articles

**You:**
> /prompt archive_candidates

**Claude:**
> I've identified 12 articles that might be worth archiving:
> 
> **Definitely Archive (outdated):**
> - "iOS 15 Design Guidelines" (Added 2 years ago) - iOS 18 is current
> - "2022 UX Trends Predictions" (Added 2 years ago) - Historical interest only
> 
> **Maybe Archive (read elsewhere):**
> - "Introduction to Figma" (Added 18 months ago) - You've likely mastered this
> 
> **Keep (still relevant):**
> - "Timeless Design Principles" (Added 1 year ago) - Core reference material

## Advanced Workflows

### Analyze and Save Analysis

**You:**
> I'm working on improving our mobile navigation. Research best practices from my Instapaper articles and save a summary back to Instapaper so I can read it on my Kindle tonight.

**Claude:**
> [Searches your articles for mobile navigation content]
> [Analyzes 5 relevant articles]
> [Creates synthesis]
> 
> I've created a comprehensive summary and saved it to Instapaper:
> 
> **Saved Article:**
> - Title: "Mobile Navigation Best Practices - Research Synthesis"
> - Description: Based on 5 articles from your library covering:
>   * Tab bar vs hamburger menu (when to use each)
>   * Bottom navigation accessibility
>   * Progressive disclosure patterns
>   * Context-aware navigation
>   * User testing insights
> 
> The full synthesis includes specific examples and actionable recommendations. It's now in your unread queue for Kindle reading.

### Reading Progress Tracking

**You:**
> I'm halfway through the long design systems article (bookmark 123456). Update my progress.

**Claude:**
> Updated! I've recorded that you're 50% through "Building Scalable Design Systems". You can continue where you left off on any device.

## Integration with Your Work

### Blog Post Research

**You:**
> I'm writing a blog post about AI in UX design. Pull relevant articles from my Instapaper and help me outline the post.

**Claude:**
> Based on 8 articles from your Instapaper library on AI in UX, here's a suggested outline:
> 
> **Title Ideas:**
> 1. "AI as Design Partner: Opportunities and Pitfalls"
> 2. "The Human-AI Collaboration in UX"
> 
> **Outline:**
> 1. Introduction
>    - Current state of AI tools in design (Figma AI, ChatGPT, etc.)
> 
> 2. Where AI Excels
>    - Rapid prototyping (from your "AI Prototyping" article)
>    - Data analysis (synthesized from 3 research articles)
>    - Accessibility checking
> 
> 3. Where Human Designers Are Essential
>    - Ethical considerations (your "Ethics of AI" article)
>    - Context and empathy
>    - Strategic thinking
> 
> 4. Practical Framework
>    - When to use AI vs. when to rely on human judgment
>    - Real examples from your reading
> 
> 5. Conclusion
>    - AI as augmentation, not replacement
> 
> Would you like me to draft any sections?

### Cross-Reference with Current Projects

**You:**
> I'm designing a new onboarding flow. What relevant articles do I have in Instapaper?

**Claude:**
> Found 4 highly relevant articles:
> 
> ⭐ **Most Relevant:**
> - "User Onboarding Patterns That Work" (Starred, from UX Collective)
>   * Covers progressive onboarding
>   * Has specific mobile examples
> 
> **Also Relevant:**
> - "Reducing Friction in Sign-up Flows"
> - "Onboarding vs. Empty States"
> - "Measuring Onboarding Success"
> 
> The starred article has 3 highlights you saved previously about reducing steps and providing clear value.

## Highlights and Notes

### Add Research Notes

**You:**
> I just read an important insight in bookmark 123456. Add this highlight at position 2500: "Users abandon onboarding when they don't see immediate value"

**Claude:**
> Highlight added! This insight has been saved to the article "Mobile Onboarding Patterns". You can review all your highlights from this article anytime.

### Review Your Highlights

**You:**
> Show me all the highlights I've made from articles about accessibility

**Claude:**
> [Searches for accessibility articles and retrieves highlights]
> 
> You have 12 highlights across 4 accessibility articles:
> 
> **From "WCAG 2.1 Guidelines":**
> 1. "Contrast ratios must be 4.5:1 for normal text"
> 2. "Keyboard navigation is not optional"
> 
> **From "Designing for Screen Readers":**
> 1. "Alt text should describe function, not appearance"
> 2. "Landmark regions improve navigation"
> ...

## Smart Recommendations

### Get Reading Suggestions

**You:**
> /prompt recommend_next_read

**Claude:**
> Based on your starred articles and reading patterns, I recommend:
> 
> **Top Pick:** "The Psychology of User Engagement"
> 
> **Why:**
> - You've starred 4 articles about user retention
> - This covers the psychological principles behind engagement
> - It's from a source (Nielsen Norman Group) you frequently star
> - At 15 minutes reading time, fits your usual pattern
> 
> **Alternative:** If you want something shorter, try "Micro-interactions That Matter" (5 min read)

## Folder-Based Organization

**You:**
> What folders do I have and how many articles are in each?

**Claude:**
> You have 6 folders:
> 
> 1. **UX Research** (18 articles) - Your largest collection
> 2. **Design Systems** (12 articles)
> 3. **AI in UX** (6 articles) - Recently created
> 4. **Accessibility** (9 articles)
> 5. **Mobile Design** (15 articles)
> 6. **Leadership** (5 articles)
> 
> Plus 23 unread articles not in folders and 156 archived articles.

## Error Handling

The server handles errors gracefully:

**You:**
> Delete bookmark 999999

**Claude:**
> I encountered an error: Bookmark 999999 doesn't exist. Would you like me to:
> 1. Search for the article you want to delete?
> 2. List your recent bookmarks?
